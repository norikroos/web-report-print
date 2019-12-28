// パラメータ読み込み
const arg  = {};
const url = location.search.substring(1).split('&');
url.forEach(function(param) {
  let k = param.split('=');
  arg[k[0]] = k[1];
});

const mediafile_id = arg.mediafile_id;

// API URL
const URL = "https://kffjc39iea.execute-api.us-east-1.amazonaws.com/wadws/media/" + mediafile_id + "/evaluate";
// const URL = "resource/runpit.json"; // TEST用

const animal_info = {
  horse : { img_name : 'horse_3x.png', animal_jp : 'うま',},
  dog : { img_name : 'dog_3x.png', animal_jp : 'いぬ',},
  cat : { img_name : 'cat_3x.png', animal_jp : 'ねこ',},
  rabbit : { img_name : 'rabbit_3x.png', animal_jp : 'うさぎ',},
  squirrel : { img_name : 'squirrel_3x.png', animal_jp : 'りす',},
};

const bar_messages = {
  'pitch': 'お子様の平均的なピッチは{value}です。スピードに乗った後はピッチが安定すると記録の向上が見込めます。一定の回転数を意識して走れるように指導してみてください。',
  'stride': 'お子様のストライドは{value}です。一般的に身長よりも大きなストライドだと記録が伸びると言われております。お子様の身長と比較していただき、大きな歩幅となるよう指導してみてください。身長に対して短い場合は、股関節のストレッチが効果的です。',
  'arm_swing': 'お子様の腕のふり幅は{value}です。もっと大きく腕を振ると、効率的に力を伝える事ができます。男の子は縦、女の子は横に腕を振ると良いと言われています。'
};

// 棒グラフ
const Bar = function(props) {
  if (!(props.title_en in bar_messages)) {
    return null;
  }
  const message = bar_messages[props.title_en];

  return ('\
    <div class="bar-container">\
      <div class="bar-labels row">\
        <p class="left col-6">' + props.title + '</p>\
        <p class="bar-value-text right col-6">' + props.value + props.unit + '</p>\
      </div>\
      <div class="bar-wrapper">\
        <div class="bar" id="bar_' + props.id + '" data-value="' + props.value + '"></div>\
      </div>\
      <p class="bar-summary">' + message.replace('{value}', props.value + props.unit) + '</p>\
    </div>\
  ');
};

// 評価項目
const CheckPoint = function(props) {
 return ('\
    <div class="check-point col-' + props.col + '" id="check_point_' + props.id + '" onclick="toggleActive(this, ' + props.frame + ');">\
      <div class="check-point-text">' + props.display_name + '</div>\
      <div class="check-point-icon">\
        <img class="off" src="' + props.icon_off_url + '">\
        <img class="on" src="' + props.icon_on_url + '">\
      </div>\
    </div>\
  ');
};

// 動画埋め込み
const video = document.getElementById('video');
video.src = 'https://d2etk9d4ec15ap.cloudfront.net/' + mediafile_id;

video.addEventListener('canplay', function() {
  video.pause();
}, {once: true});

// タブ切り替え
$('.tab').on('click', function() {
  const content_id = $(this).data('content');
  switchActiveTab(content_id);
  $('.tab-contents').slick('slickGoTo', content_id - 1);
});

$('.tab-contents').on('swipe', function() {
  switchActiveTab($(this).slick('slickCurrentSlide') + 1);
});

const switchActiveTab = function(content_id) {
  $('#bottom_line').removeClass().addClass('transition position-' + content_id); // 下線移動
  $('.tab.active').removeClass('active');
  $('#tab_' + content_id).addClass('active');
}

$('.tab-contents').slick({
  accesibility: false,
  autoplay: false,
  speed: 200,
  infinite: false,
  draggable: false,
  fade: false,
  cssEase: 'ease',
  arrows: false,
  centerPadding: 0,
  mobileFirst: true,
  touchThreshold: 10,
  adaptiveHeight: true,
});

// check point 表示切り替え
const toggleActive = function(e, frame) {
  const check_point_id = $(e).data('id');

  if ($(e).hasClass('active')) {
    return null;
  }

  video.currentTime = frame / 29.97;

  $('.check-point.active').removeClass('active');
  $('.check-point img.on').hide();
  $('.check-point img.off').show();
  $(e).addClass('active');
  $(e).find('img.off').hide();
  $(e).find('img.on').fadeIn(200);
  return null;
};

// APIリクエスト
$.ajax({
    type: "GET",
    url: URL,
    dataType: "json",
    error: function() {
      $('.loader').hide();
      $('.content').html('<p class="error-message">データを取得できませんでした。</p>');
      console.error('failed to load data');
    },
    success: function(res) {
      $('.loader').hide();
      jsonData = res;

      // summary data描画
      const summaryData = jsonData.summary_data;
      summaryData.forEach(function(value, index) {
        const values = Object.assign(value, {id: String(index+1)});
        $('#bars_area').append(Bar(values));
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
      const checkPointData = jsonData.check_point_icon_data;
      const checkPointCol = parseInt(12 / checkPointData.length);
      checkPointData.forEach(function(value, index) {
        const values = Object.assign(value, {id: String(index+1), col: String(checkPointCol)});
        $('#check_point_container').append(CheckPoint(values));
      });

      $('.loading-content').show();
    }
});