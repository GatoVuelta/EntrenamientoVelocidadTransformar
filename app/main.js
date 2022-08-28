import $ from 'jquery';
import { DateTime } from 'luxon';
import {Howl, Howler} from 'howler';
import tippy from 'tippy.js';
import './tippy.css';
import Timer from "easytimer.js";
import UIkit from 'uikit';

window.DateTime = DateTime;

window.$ = $;

// -- Tippy --
tippy('#help-estricto', {
  content: 'Cambia a la siguiente pregunta/bloque automáticamente al finalizar el tiempo',
});
tippy('#btn-next .icon', {
  content: 'Presiona "Espacio" para pasar a la siguiente pregunta/bloque',
});

// -- Sounds --
var soundClockTick1 = new Howl({
  src: ['/sounds/tick1.mp3'],
});

var soundClockTick2 = new Howl({
  src: ['/sounds/tick2.mp3'],
});

var soundBeep = new Howl({
  src: ['/sounds/beep.mp3'],
});

var soundFinalBeep = new Howl({
  src: ['/sounds/beep-final.mp3'],
});

// -- Constants --
const circle_total = document.querySelector("g.circle_.total > circle.a");
const circle_bloque = document.querySelector("g.circle_.bloque > circle.a");
const circle_pregunta = document.querySelector("g.circle_.pregunta > circle.a");

var blocks = {
  "Verbal": {
    name: "Verbal",
    questions: 40,
  },
  "Logico": {
    name: "Lógico",
    questions: 40,
  },
  "Numerico": {
    name: "Numérico",
    questions: 40,
  },
  "AtencionYConcentracion": {
    name: "Atención y concentración",
    questions: 40,
  }
}

var blocks_total = 0;
for (var block in blocks) {
  if (blocks.hasOwnProperty(block)) {
    blocks_total++;
  }
}

var max_questions = 160;

/**
 * Cuenta las pareguntas totales
 * @author Andrés
 * @date 2022-08-27
 * @returns {Number} number of questions
 */
function countQuestions() {
  var questions = 0;
  for (var block in blocks) {
    if (blocks.hasOwnProperty(block)) {
      questions += blocks[block].questions;
    }
  }
  return questions;
}

/**
 * Obtiene el bloque actual en número
 * @author Andrés
 * @date 2022-08-27
 * @param {String} name
 * @returns {Number} block number
 */
function getCurrentBlockNumber(name) {
  var current = 0;
  for (var block in blocks) {
    if (blocks.hasOwnProperty(block)) {
      current++;
      if (block == name) {
        return current;
      }
    }
  }
  return 1;
}

/**
 * Obtiene el siguiente bloque
 * @author Andrés
 * @date 2022-08-27
 * @param {String} name - the current block name
 * @returns {String} block name
 */
function getNextBlock(name) {
  var current = 0;
  for (var block in blocks) {
    if (blocks.hasOwnProperty(block)) {
      current++;
      if (block == name) {
        return Object.keys(blocks)[current];
      }
    }
  }
  return Object.keys(blocks)[0];
}

/**
 * Obtiene el bloque anterior
 * @author Andrés
 * @date 2022-08-27
 * @param {String} name - the current block name
 * @returns {String} block name
 */
function getPreviousBlock(name) {
  var current = 0;
  for (var block in blocks) {
    if (blocks.hasOwnProperty(block)) {
      current++;
      if (block == name) {
        return Object.keys(blocks)[current - 2];
      }
    }
  }
  return Object.keys(blocks)[0];
}

window.getCurrentBlockNumber = getCurrentBlockNumber;
window.getNextBlock = getNextBlock;
window.getPreviousBlock = getPreviousBlock;

const current_block_text = document.querySelector("#test-bloque");
const current_block_number_text = document.querySelector("#count-currentblock");

const current_time_total_text = document.querySelector(".time.total");
const current_time_bloque_text = document.querySelector(".time.bloque");
const current_time_pregunta_text = document.querySelector(".time.pregunta");

const current_question_count_text = document.querySelector("#count-currentquestion");
const questions_total_count_text = document.querySelector("#count-totalquestions");
const current_block_total_questions_text = document.querySelector("#count-currentblockquestions");

// Max times

var max_time_total    = 60 * 60   * 1000;
var max_time_bloque   = 15 * 60   * 1000;
var max_time_pregunta =      22.5 * 1000;
console.log("Total time pregunta: " + max_time_pregunta);

// Current stats

var current_question = {
  block: "Verbal",
  question: 1,
};

var ideal_question = 1;
var ideal_block = 1;

// Percentages

var percentage_total_ideal = 0;
var percentage_total = 0;

var percentage_bloque_ideal = 0;
var percentage_bloque = 0;

var percentage_pregunta = 0;

// Config

var config = {
  strictMode: false,
  sound: {
    clockTick: true,
    lastSeconds: true
  }
};

// -- Functions --

/**
 * @author Andrés
 * @date 2022-08-26
 * @param {Element} circle - circle name
 * @param {any} percentage - the percentage
 * @returns {void}
 */
function updateCircle(circle, { real=NaN, ideal=NaN }) {
  var circle_lenght = circle.getTotalLength();
  var percentage_real = real;
  var percentage_ideal = ideal;
  if (!isNaN(percentage_real)) {
    $(circle).css("stroke-dasharray", circle_lenght);
    $(circle).css("stroke-dashoffset", circle_lenght - (circle_lenght * percentage_real / 100));
  }

  if (!isNaN(percentage_ideal)) {
    $(circle).parent().find("circle.s").css("stroke-dasharray", circle_lenght);
    $(circle).parent().find("circle.s").css("stroke-dashoffset", circle_lenght - (circle_lenght * percentage_ideal / 100));
  }
}

var inquiz = false;
var paused = false;

//Initialize everything
$(document).ready(function() {
  updateCircle(circle_total, { real: percentage_total, ideal: percentage_total_ideal });
  updateCircle(circle_bloque, { real: percentage_bloque, ideal: percentage_bloque_ideal });
  updateCircle(circle_pregunta, { real: percentage_pregunta });
});


var timerTotal = new Timer();
var timerBloque = new Timer();
var timerPregunta = new Timer();

var timerTotalIdeal = new Timer();
var timerBloqueIdeal = new Timer();

//Buttons
$("#btn-start").on("click", function() {
  if (!inquiz) {
    $(this).text("Iniciando en 3...");
    setTimeout(function() {
      $("#btn-start").text("Iniciando en 2...");
      setTimeout(function() {
        $("#btn-start").text("Iniciando en 1...");
        setTimeout(function() {
          inquiz = true;
          $("#btn-start").text("Iniciar");
          $("#btn-pause").removeClass("uk-disabled");
          $("#btn-stop").removeClass("uk-disabled");
          //Start timer
          startTimer();
        }, 1000);
      }, 1000);
    }, 1000);
  } else {
    paused = false;
    $(this).text("Iniciar");
    $("#btn-pause").removeClass("uk-disabled");

    //Start timers
    timerTotal.start();
    timerBloque.start();
    timerPregunta.start();

    timerTotalIdeal.start();
    timerBloqueIdeal.start();
  }
  $(this).addClass("uk-disabled");
  $(this).blur();
});

$("#btn-pause").on("click", function() {
  paused = true;
  $(this).addClass("uk-disabled");
  $("#btn-start").removeClass("uk-disabled");
  $("#btn-start").text("Reanudar");

  //Pause timers
  timerTotal.pause();
  timerBloque.pause();
  timerPregunta.pause();

  timerTotalIdeal.pause();
  timerBloqueIdeal.pause();

  $(this).blur();
});

$("#btn-stop").on("click", function() {
  paused = false;
  inquiz = false;
  $(this).addClass("uk-disabled");
  $("#btn-start").removeClass("uk-disabled");
  $("#btn-start").text("Iniciar");
  $("#btn-pause").addClass("uk-disabled");
  $("#btn-next").addClass("uk-disabled");
  resetNextButton();

  //Reset timers
  timerTotal.reset();
  timerBloque.reset();
  timerPregunta.reset();
  timerTotal.stop();
  timerBloque.stop();
  timerPregunta.stop();

  timerTotalIdeal.reset();
  timerBloqueIdeal.reset();
  timerTotalIdeal.stop();
  timerBloqueIdeal.stop();

  resetAllTexts();

  //Reset variables
  current_question = {
    block: "Verbal",
    question: 1,
  };

  $(this).blur();
});


function startTimer() {
  updateCircle(circle_total, { real: 0, ideal: 0 });
  updateCircle(circle_bloque, { real: 0, ideal: 0 });

  //Set the current block and question
  $(current_block_text).text(blocks[current_question.block].name);

  $(current_question_count_text).text(current_question.question);
  $(current_block_number_text).text(getCurrentBlockNumber(current_question.block));
  $(current_block_total_questions_text).text(blocks[current_question.block].questions);

  $(questions_total_count_text).text(countQuestions());

  $("#btn-next").removeClass("uk-disabled");
  //Total
  timerTotal.start({
    countdown: true,
    startValues: {
      minutes: 60,
    }
  });
  timerTotal.addEventListener('secondsUpdated', function (e) {
    $(current_time_total_text).text(timerTotal.getTimeValues().toString(['minutes', 'seconds']));
    alertLowTime(timerTotal, current_time_total_text, 60);
  });
  timerTotal.addEventListener('targetAchieved', function (e) {
    timerTotal.stop();
    UIkit.modal.alert('⏰ Se acabó el tiempo').then(function () {
      $("#btn-stop").trigger("click");
    });
  });

  //Bloque
  timerBloque.start({
    countdown: true,
    startValues: {
      minutes: 15,
      seconds: 0,
    }
  });
  timerBloque.addEventListener('secondsUpdated', function (e) {
    $(current_time_bloque_text).text(timerBloque.getTimeValues().toString(['minutes', 'seconds']));
    alertLowTime(timerBloque, current_time_bloque_text, 60);
  });
  timerBloque.addEventListener('targetAchieved', function (e) {
    if ((getCurrentBlockNumber(current_question.block)) < 4) {
      current_question.block = getNextBlock(current_question.block);
      current_question.question = 1;
      timerBloque.reset();
      timerBloque.start();
      setTimeout(function() {
        $(current_block_number_text).text(getCurrentBlockNumber(current_question.block));
        $(current_block_text).text(blocks[current_question.block].name);
        $(current_question_count_text).text(current_question.question);
        $(current_block_total_questions_text).text(blocks[current_question.block].questions);
      }, 1000);
    }
  });

  //Pregunta
  timerPregunta.start({
    countdown: true,
    startValues: {
      seconds: 22,
      secondTenths: 5,
    },
    precision: 'secondTenths'
  });
  timerPregunta.addEventListener('secondTenthsUpdated', function (e) {
    $(current_time_pregunta_text).text(timerPregunta.getTimeValues().toString(['minutes', 'seconds', 'secondTenths']));
    alertLowTime(timerPregunta, current_time_pregunta_text, 5, true);
    let current_taken_time_secs = timerPregunta.getTimeValues().seconds;
    let current_taken_time_ths = timerPregunta.getTimeValues().secondTenths;
    let current_taken_time_ms = (current_taken_time_secs * 1000) + (current_taken_time_ths * 100);
    let max_time = max_time_pregunta;
    let percentage_pregunta = (current_taken_time_ms * 100) / max_time;
    updateCircle(circle_pregunta, { real: 100 - percentage_pregunta });
  });
  timerPregunta.addEventListener('secondsUpdated', function (e) {
    playTickSound(timerPregunta, 10, 3);
  });
  timerPregunta.addEventListener('targetAchieved', function (e) {
    if ($("#btn-next").hasClass("uk-disabled")) {
      return;
    }
    //Next
    ideal_question++;
    if (config.strictMode) {
      $("#btn-next").trigger("click");
    } else {
      //updateGraph(true);
    }
  });

  //TotalIdeal
  timerTotalIdeal.start({
    // startValues: {
    //   minutes: 50,
    // }
  });
  timerTotalIdeal.addEventListener('secondsUpdated', function (e) {
    let current_taken_time_secs = timerTotalIdeal.getTimeValues().seconds;
    let current_taken_time_min = timerTotalIdeal.getTimeValues().minutes;
    let current_taken_time_ms = (current_taken_time_min * 60 * 1000) + (current_taken_time_secs * 1000);
    let max_time = max_time_total;
    let percentage_total = (current_taken_time_ms * 100) / max_time;
    percentage_total_ideal = percentage_total;
    updateCircle(circle_total, { ideal: percentage_total });
  });

  //BloqueIdeal
  timerBloqueIdeal.start({
    // startValues: {
    //   minutes: 10,
    // }
  });
  timerBloqueIdeal.addEventListener('secondsUpdated', function (e) {
    let current_taken_time_secs = timerBloqueIdeal.getTimeValues().seconds;
    let current_taken_time_min = timerBloqueIdeal.getTimeValues().minutes;
    let current_taken_time_ms = (current_taken_time_min * 60 * 1000) + (current_taken_time_secs * 1000);
    let max_time = max_time_bloque;
    let percentage_bloque = (current_taken_time_ms * 100) / max_time;
    percentage_bloque_ideal = percentage_bloque;
    updateCircle(circle_bloque, { ideal: percentage_bloque });
  });
}

function resetAllTexts() {
  //Total
  $(current_time_total_text).text("60:00");
  $(current_time_total_text).removeClass("alert");
  $(current_time_total_text).removeClass("alert-end");
  //Bloque
  $(current_time_bloque_text).text("15:00");
  $(current_time_bloque_text).removeClass("alert");
  $(current_time_bloque_text).removeClass("alert-end");
  //Pregunta
  $(current_time_pregunta_text).text("00:22:5");
  $(current_time_pregunta_text).removeClass("alert");
  $(current_time_pregunta_text).removeClass("alert-end");
  //Counts
  $(current_block_number_text).text("~");
  $(current_block_text).text("~");
  $(current_question_count_text).text("~");
  $(current_block_total_questions_text).text("~");
}

function updateGraph(){
  let current_question_number = current_question.question ;
  let previous_block_questions = 0;
  switch (getCurrentBlockNumber(current_question.block)) {
    case 4:
      previous_block_questions += blocks["Verbal"].questions;
      previous_block_questions += blocks["Logico"].questions;
      previous_block_questions += blocks["Numerico"].questions;
      break;
    case 3:
      previous_block_questions += blocks["Verbal"].questions;
      previous_block_questions += blocks["Logico"].questions;
      break;
    case 2:
      previous_block_questions += blocks["Verbal"].questions;
      break;
    default:
      break;
  }
  current_question_number += previous_block_questions;
  percentage_total = (current_question_number / countQuestions()) * 100;
  updateCircle(circle_total, { real: percentage_total});

  percentage_bloque = (current_question.question / blocks[current_question.block].questions) * 100;
  updateCircle(circle_bloque, { real: percentage_bloque});
}

$("#btn-next").on("click", function() {
  if($(this).hasClass("pregunta")) {
    if (current_question.question < blocks[current_question.block].questions) {
      current_question.question++;
      $(current_question_count_text).text(current_question.question);
      timerPregunta.reset();
      timerPregunta.start();

      //Update Graph and stimations
      updateGraph();
    }
    if (current_question.question == blocks[current_question.block].questions) {
      $("#btn-next .text").text("Siguiente bloque");
      $(this).removeClass("pregunta")
      $(this).addClass("block");
    }
    if (((getCurrentBlockNumber(current_question.block)) == 4) && (current_question.question == blocks[current_question.block].questions)) {
      $(this).addClass("finalizar");
      $(this).removeClass("block");
      $("#btn-next .text").text("Finalizar");
    }
  } else if ($(this).hasClass("block")) {
    if ((getCurrentBlockNumber(current_question.block)) < 4) {
      resetNextButton();
      current_question.block = getNextBlock(current_question.block);
      current_question.question = 1;
      $(current_block_number_text).text(getCurrentBlockNumber(current_question.block));
      $(current_block_text).text(blocks[current_question.block].name);
      $(current_question_count_text).text(current_question.question);
      $(current_block_total_questions_text).text(blocks[current_question.block].questions);
      timerBloque.reset();
      timerBloque.start();

      //Pregunta
      timerPregunta.reset();
      timerPregunta.start();

      //Update Graph and stimations
      updateGraph();
    }
  } else if ($(this).hasClass("finalizar")) {
    timerTotalIdeal.pause();
    let timeTaken = timerTotalIdeal.getTimeValues().toString();
    UIkit.modal.dialog(`<div class="uk-modal-body"><p class="uk-text-bold uk-text-center">👍 Examen terminado! </p> <span class="uk-text-bold">Tiempo usado: </span>${timeTaken}</div>`);
    $("#btn-stop").trigger("click");
  }
});

//on press of spacebar
$(document).on("keydown", function(e) {
  if (e.which == 32) {
    if ($("#btn-next").hasClass("uk-disabled")) { return }
    if ($("#btn-next").data("down") !== true) {
      $("#btn-next").addClass("kb-down");
      $("#btn-next").data("down", true);
    }
  }
});

//on release of spacebar
$(document).on("keyup", function(e) {
  if (e.which == 32) {
    if ($("#btn-next").hasClass("uk-disabled")) { return }
    $("#btn-next").removeClass("kb-down");
    $("#btn-next").data("down", false);
    if (inquiz) {
      $("#btn-next").trigger("click");
    }
  }
});

function resetNextButton() {
  $("#btn-next .text").text("Siguiente pregunta");
  $("#btn-next").removeClass("block");
  $("#btn-next").removeClass("finalizar");
  $("#btn-next").addClass("pregunta");
}

/**
 * @author Andrés
 * @date 2022-08-28
 * @param {Timer} timer
 * @param {Number} warningTime
 * @param {Number} lowTime
 * @returns {void}
 */
function playTickSound(timer, warningTime, lowTime) {
  var sound = Math.random() < 0.5 ? soundClockTick1 : soundClockTick2;
  if (timer.getTimeValues().seconds <= 0) {
    soundFinalBeep.play();
  } else if (timer.getTimeValues().seconds <= lowTime) {
    if (config.sound.clockTick) {
      sound.play();
      setTimeout(function() {
        sound.play();
      }, 500);
    }
    if (config.sound.lastSeconds) {
      soundBeep.play();
    }
  } else if (timer.getTimeValues().seconds <= warningTime) {
    if (config.sound.clockTick) {
      sound.play();
      setTimeout(function() {
        sound.play();
      }, 500);
    }
  } else {
    if (config.sound.clockTick) {
      sound.play();
    }
  }
}

$("#check-sonido-usegundos").on("change", function() {
  config.sound.lastSeconds = $(this).is(":checked");
});

$("#check-sonido-segundos").on("change", function() {
  config.sound.clockTick = $(this).is(":checked");
});

$("#check-estricto").on("change", function() {
  config.strictMode = $(this).is(":checked");
});

$("#check-opciones").on("change", function() {
  $("#opciones-ctn").toggle(
    {
      duration: 200,
    }
  );
});

$("#volume").on("input", function() {
  var volume = $(this).val();
  soundClockTick1.volume(volume);
  soundClockTick2.volume(volume);
  soundBeep.volume(volume);
  soundFinalBeep.volume(volume);
});

/**
 * Esta función añade la clase "alert" si el elemento que muestra el timer actual está por terminar
 * @author Andrés
 * @date 2022-08-27
 * @param {Timer} timer - timer name
 * @param {Element} element - element name
 * @param {Number} time - time to alert (seconds)
 * @returns {any}
 */
function alertLowTime(timer, element, time = 5) {
  $(element).removeClass("alert");
  $(element).removeClass("alert-end");
  if (timer.getTimeValues().minutes == 0 && timer.getTimeValues().seconds <= time) {
    if (timer.getTimeValues().seconds == 0) {
      $(element).addClass("alert-end");
    } else {
      $(element).addClass("alert");
    }
  }
}