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
  video.src = "https://d2etk9d4ec15ap.cloudfront.net/" + mediafile_id;
  video.play();
  video.addEventListener('canplay', async function() {
    // console.log('canplay');
    for (let index = 0; index < checkPointData.length; index++) {
      const value = checkPointData[index];
      // console.log(value.frame);
      await drawVideoFrameImage(index + 1, value.frame);
    }
    $(".loader").hide();
    $(".print-form").show();
  });
};

// QRコード生成
$('#qr').qrcode(location.href.replace('print', 'index'));

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
    const summaryData = jsonData.summary_data;
    summaryData.forEach(function(value, index) {
      if (!(value.title_en in bar_messages)) {
        return;
      }
      const message = bar_messages[value.title_en].replace('{value}', value.value + value.unit);
      const values = Object.assign(value, {id: String(index+1), message: message});
      $("#bars_area").append(Bar(values));
    });

    const animal_en = getAnimalFromVelocity(jsonData.velocity);

    $('#animal_img').attr({'src': 'img/animals/' + animal_info[animal_en].img_name});
    $('#animal_name').text(animal_info[animal_en].animal_jp);

    // check point描画
    showCheckPointData(jsonData.check_point_icon_data);

    $('.loading-content').show();
  }
});