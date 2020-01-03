// パラメータ読み込み
const arg = {};
const url = location.search.substring(1).split("&");
url.forEach(function(param) {
  let k = param.split("=");
  arg[k[0]] = k[1];
});

let jsonData = {};

const mediafile_id = arg.mediafile_id;

const video = document.getElementById("video");

video.addEventListener('canplay', function() {
  video.pause();
}, {once: true});

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
    "お子様の平均的なピッチは<span class='red'>{value}</span>です。腰を高い位置でキープし、スピードに乗った後はピッチが安定すると記録の向上が見込めます。一定の回転数を意識して走れるように指導してみてください。",
  stride:
    "お子様のストライドは<span class='red'>{value}</span>です。一般的に身長よりも大きなストライドだと記録が伸びると言われています。お子様の身長と比較していただき、大きなストライドとなるよう指導してみてください。ランジなどのトレーニングが良いでしょう。ただしお子様の身体の特徴によって変化しますので、無理はしないようご注意ください。",
  arm_swing:
    "お子様の腕のふり幅は<span class='red'>{value}</span>です。素早く腕を振ることを指導してみてください。素早い腕振り動作によって、地面を蹴る力が大きくなり、それによりピッチ・ストライドが向上し、さらにスピードが増すでしょう。"
};

// 棒グラフ
const Bar = function(props) {
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
    props.message +
    "</p>\
    </div>\
  "
  );
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

const getAnimalFromVelocity = function(velocity) {
  if (velocity <= 5.0) {
    return 'squirrel';
  }
  if (velocity <= 5.8) {
    return 'rabbit';
  }
  if (velocity <= 6.5) {
    return 'cat';
  }
  if (velocity <= 7.3) {
    return 'dog';
  }
  return 'horse';
};