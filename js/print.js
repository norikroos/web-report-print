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
  "https://kffjc39iea.execute-api.us-east-1.amazonaws.com/wadws/media/" +
  mediafile_id +
  "/evaluate";
// const URL = "resource/runpit.json"; // TEST用

const animal_info = {
  horse : { img_name : 'horse_3x.png', animal_jp : 'うま',},
  dog : { img_name : 'dog_3x.png', animal_jp : 'いぬ',},
  cat : { img_name : 'cat_3x.png', animal_jp : 'ねこ',},
  rabbit : { img_name : 'rabbit_3x.png', animal_jp : 'うさぎ',},
  squirrel : { img_name : 'squirrel_3x.png', animal_jp : 'りす',},
};

const bar_messages = {
  pitch:
    "お子様の平均的なピッチは<span class='red'>{value}</span>です。スピードに乗った後はピッチが安定すると記録の向上が見込めます。一定の回転数を意識して走れるように指導してみてください。",
  stride:
    "お子様のストライドは<span class='red'>{value}</span>です。一般的に身長よりも大きなストライドだと記録が伸びると言われております。お子様の身長と比較していただき、大きな歩幅となるよう指導してみてください。身長に対して短い場合は、股関節のストレッチが効果的です。",
  arm_swing:
    "お子様の腕のふり幅は平均よりも<span class='red'>{value}</span>です。もっと大きく腕を振ると、効率的に力を伝える事ができます。男の子は縦、女の子は横に腕を振ると良いと言われています。"
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

const drawVideoFrameImage = function(id, frame) {
  return new Promise(function(resolve) {
    // console.log('call draw');
    video.currentTime = frame / 29.97;
    video.addEventListener('timeupdate', function() {
      // console.log('state:', video.readyState, ', currentTime: ', video.currentTime);
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

const showCheckPointData = function(checkPointData) {
  // console.log('showCheckpointData');
  video.addEventListener('canplay', async function() {
    // console.log('canplay');
    const checkPointCol = parseInt(12 / checkPointData.length);
    for (let index = 0; index < checkPointData.length; index++) {
      const value = checkPointData[index];
      // console.log(value.frame);
      await drawVideoFrameImage(index + 1, value.frame);
    }
    $(".loader").hide();
    $(".print-form").show();
  }, {once: true});
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

$('#print_button').on('click', function() {
  // $('#child_name').text($('#input_name').val());
  // $('#height').text($('#input_height').val());
  // $('#weight').text($('#input_weight').val());
  window.print();
});

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

    // console.log(jsonData);

    // summary data描画
    const display_list = ["pitch", "stride", "arm_swing"];
    const summaryData = jsonData.summary_data;
    summaryData.forEach(function(value, index) {
      if (display_list.indexOf(value.title_en) > -1) {
        const values = Object.assign(value, { id: String(index + 1) });
        $("#bars_area").append(Bar(values));
      }
    });

    // const velocity = summaryData.find(e => e.title_en == 'pitch').value / 60 * summaryData.find(e => e.title_en == 'stride').value / 100;
    const velocity = jsonData.velocity;
    let animal_en = 'horse';

      if (velocity <= 5.0) {
        animal_en = 'squirrel';
      } else if (velocity <= 5.8) {
        animal_en = 'rabbit';
      } else if (velocity <= 6.5) {
        animal_en = 'cat';
      } else if (velocity <= 7.3) {
        animal_en = 'dog';
      }

      $('#animal_img').attr({'src': 'img/animals/' + animal_info[animal_en].img_name});
      $('#animal_name').text(animal_info[animal_en].animal_jp);

    // check point描画
    showCheckPointData(jsonData.check_point_icon_data);

    $('.loading-content').show();
  }
});
