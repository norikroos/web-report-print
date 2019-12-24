// パラメータ読み込み
const arg = {};
const url = location.search.substring(1).split("&");
url.forEach(function(param) {
  let k = param.split("=");
  arg[k[0]] = k[1];
});

let jsonData = {};

const mediafile_id = arg.mediafile_id;

// API URL
const URL =
  "https://kffjc39iea.execute-api.us-east-1.amazonaws.com/test/media/" +
  mediafile_id +
  "/evaluate";
// const URL = "resource/runpit.json"; // TEST用

const bar_messages = {
  pitch:
    "お子様の平均的なピッチは{value}です。スピードに乗った後はピッチが安定すると記録の向上が見込めます。一定の回転数を意識して走れるように指導してみてください。",
  stride:
    "お子様のストライドは{value}です。一般的に身長よりも大きなストライドだと記録が伸びると言われております。お子様の身長と比較していただき、大きな歩幅となるよう指導してみてください。身長に対して短い場合は、股関節のストレッチが効果的です。",
  arm_swing:
    "お子様の腕のふり幅は平均よりも{value}です。もっと大きく腕を振ると、効率的に力を伝える事ができます。男の子は縦、女の子は横に腕を振ると良いと言われています。"
};

// 棒グラフ
const Bar = function(props) {
  const message = bar_messages[props.title_en];
  return (
    '\
    <div class="bar-container">\
      <div class="bar-labels row">\
        <p class="left col-6">' +
    props.title +
    '</p>\
        <p class="bar-value-text right col-6">' +
    props.value +
    props.unit +
    '</p>\
      </div>\
      <div class="bar-wrapper">\
        <div class="bar" id="bar_' +
    props.id +
    '" data-value="' +
    props.value +
    '"></div>\
      </div>\
      <p class="bar-summary">' +
    message.replace("{value}", props.value + props.unit) +
    "</p>\
    </div>\
  "
  );
};

var video = document.getElementById("video");
video.src = "https://d2etk9d4ec15ap.cloudfront.net/" + mediafile_id;
video.play();

const drawVideoFrameImage = function(id, frame) {
  return new Promise(function(resolve) {
    console.log('call draw');
    video.currentTime = frame / 29.97;
    video.addEventListener('timeupdate', function() {
      console.log('state:', video.readyState, ', currentTime: ', video.currentTime);
      const image = document.getElementById("canvas_" + id);
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas
        .getContext("2d")
        .drawImage(
          video,
          0,
          0
        );
      image.src = canvas.toDataURL();
      return resolve();
    }, {once: true});
  });
};

// 評価項目
const CheckPoint = function(props) {
  return (
    '\
    <div class="check-point col-' +
    props.col +
    '" id="check_point_' +
    props.id +
    '" onclick="toggleActive(this, ' +
    props.frame +
    ');">\
      <div class="check-point-text">' +
    props.display_name +
    '</div>\
      <div class="check-point-icon">\
        <img class="off" src="' +
    props.icon_off_url +
    '">\
        <img class="on" src="' +
    props.icon_on_url +
    '">\
      </div>\
    </div>\
  '
  );
};

const showCheckPointData = function(checkPointData) {
  video.addEventListener('loadeddata', async function() {
    const checkPointCol = parseInt(12 / checkPointData.length);
    for (let index = 0; index < checkPointData.length; index++) {
      const value = checkPointData[index];
      console.log(value.frame);
      await drawVideoFrameImage(index + 1, value.frame);
      const values = Object.assign(value, {
        id: String(index + 1),
        col: String(checkPointCol)
      });
      $("#check_point_container").append(CheckPoint(values));
    }
    $(".loader").hide();
    $(".print-form").show();
  });
};

// QRコード生成
$('#qr').qrcode(location.href.replace('print', 'index'));

const switchActiveTab = function(content_id) {
  $("#bottom_line")
    .removeClass()
    .addClass("transition position-" + content_id); // 下線移動
  $(".tab.active").removeClass("active");
  $("#tab_" + content_id).addClass("active");
};

// check point 表示切り替え
const toggleActive = function(e, frame) {
  const check_point_id = $(e).data("id");

  if ($(e).hasClass("active")) {
    return null;
  }

  video.currentTime = frame / 29.97;

  $(".check-point.active").removeClass("active");
  $(".check-point img.on").hide();
  $(".check-point img.off").show();
  $(e).addClass("active");
  $(e)
    .find("img.off")
    .hide();
  $(e)
    .find("img.on")
    .fadeIn(200);
  return null;
};

// APIリクエスト
$.ajax({
  type: "GET",
  url: URL,
  dataType: "json",
  error: function() {
    $(".loader").hide();
    $(".content").html(
      '<p class="error-message">データを取得できませんでした。</p>'
    );
    console.error("failed to load data");
  },
  success: function(res) {
    jsonData = res;

    console.log(jsonData);

    $("#animal_img").attr({ src: "img/animal.png" });
    $(".loading-content").show();

    // summary data描画
    const display_list = ["pitch", "stride", "arm_swing"];
    const summaryData = jsonData.summary_data;
    summaryData.forEach(function(value, index) {
      if (display_list.indexOf(value.title_en) > -1) {
        const values = Object.assign(value, { id: String(index + 1) });
        $("#bars_area").append(Bar(values));
      }
    });

    // check point描画
    showCheckPointData(jsonData.check_point_icon_data);
  }
});
