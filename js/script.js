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
};

// check point 表示切り替え
const toggleActive = function(e, frame) {
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
});

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
      jsonData = res;

      // summary data描画
      const summaryData = jsonData.summary_data;
      summaryData.forEach(function(value, index) {
        if (!(value.title_en in bar_messages)) {
          return;
        }
        const message = bar_messages[value.title_en].replace('{value}', value.value + value.unit);
        const values = Object.assign(value, {id: String(index+1), message: message});
        $('#bars_area').append(Bar(values));
      });

      const animal_en = getAnimalFromVelocity(jsonData.velocity);

      $('#animal_img').attr({'src': 'img/animals/' + animal_info[animal_en].img_name});
      $('#animal_name').text(animal_info[animal_en].animal_jp);

      // check point描画
      const checkPointData = jsonData.check_point_icon_data;
      const checkPointCol = parseInt(12 / checkPointData.length);
      checkPointData.forEach(function(value, index) {
        if (value.check_point_category == 'follow_through') {
          value.display_name = 'フォロースルー';
        }
        const values = Object.assign(value, {id: String(index+1), col: String(checkPointCol)});
        $('#check_point_container').append(CheckPoint(values));
        $('.tab-contents').slick('slickSetOption', {adaptiveHeight: true});
      });

      $('.loader').hide();
      $('.tab-contents').addClass('loaded');
      $('.tab-contents').slick('slickSetOption', {adaptiveHeight: true});
    }
});

video.src = "https://d2etk9d4ec15ap.cloudfront.net/" + mediafile_id;