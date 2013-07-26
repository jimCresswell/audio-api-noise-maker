/*
 * TODO:
 * Heterodyne the oscialltor signals.
 *
 *  X/Y motion detection: do webcams have deoth detection?
 *  http://www.soundstep.com/blog/2012/03/22/javascript-motion-detection/
 *  http://www.adobe.com/devnet/html5/articles/javascript-motion-detection.html
 *  Have the theramin be on only part of the page. Have the (average of ten) left most moving pixel control frequency, (average of ten) top most control volume
 */

var helpers = (function helpers(DOCUMENT) {
	function getElById(id){
		return DOCUMENT.getElementById(id);
	}

	return {
		getElById: getElById
	};
}(window.document));

// Define the controls controller
var controls = {};
controls.controller = (function (HELPERS){

	var getElById = HELPERS.getElById,

		// Control constructor
		Control = function (inputElId, displayElId, eventKey, customEventFunction, displayMapping) {
			var thisControl = this,
				controlEl = getElById(inputElId),
				displayEl = getElById(displayElId);

			function getControlValue() {
				return controlEl.value;
			}

			function getMaxControlValue() {
				return controlEl.max;
			}

			function setControlValue(value) {
				controlEl.value = value;
			}

			function updateDisplayedControlValue() {
				var value = getControlValue(controlEl);
				if (displayMapping) {
					value = displayMapping(value);
				}
				displayEl.innerText = value;
			}

			// Add listeners to the control DOM element.
			controlEl.addEventListener(eventKey, function (event) {
				if (typeof customEventFunction === 'function') {
					customEventFunction();
				}
				updateDisplayedControlValue();
			}, false);

			return {
				getValue: getControlValue,
				getMaxValue: getMaxControlValue,
				setValue: setControlValue,
				updateDisplayedValue: updateDisplayedControlValue
			};
		};

	function create	(inputElId, displayElId, eventKey, customEventFunction, displayMapping) {
		return new Control(inputElId, displayElId, eventKey, customEventFunction, displayMapping);
	}

	return {
		create: create
	};
}(helpers));

var audio = {};
audio.controller = (function audioController() {

	var context = new webkitAudioContext(),
		oscillatorNode1 = context.createOscillator(),
		oscillatorNode2 = context.createOscillator(),
		convolverNode = context.createConvolver(),
		compressorNode = context.createDynamicsCompressor(),
		gainNode = context.createGainNode(),
		sampleRate = context.sampleRate,
		maxAmplitude;


	function initOscillator() {
		var sineWave = 0,
			squareWave = 1,
			sawtoothWave = 2,
			triangleWave = 3;

		oscillatorNode2.type = sineWave;
		oscillatorNode2.frequency.value = 220;

		oscillatorNode1.type = sineWave;
	}

	function connectNodes() {
		oscillatorNode1.connect(gainNode);

		// use the second oscillator as the convolution buffer
		// oscillatorNode1.connect(convolverNode);
		//convolverNode.buffer = stuff... oscillatorNode12
		//convolverNode.connect(gainNode);
		
		gainNode.connect(compressorNode);
		compressorNode.connect(context.destination);
	}

	function setFrequency(frequency) {
		oscillatorNode1.frequency.value = frequency;
	}

	function setMaxVolume (maxVolume) {
		maxAmplitude = maxVolume;
	}

	function setVolume(amplitude) {
		var gain;
		if (maxAmplitude === undefined) return;
		gain = amplitude/maxAmplitude;
		gainNode.gain.value = gain;
	}

	function makeSound() {
		connectNodes();
		oscillatorNode1.noteOn(0);
		oscillatorNode2.noteOn(0);
	}

	function stopSound() {
		compressorNode.disconnect();
	}

	return {
		initOscillator: initOscillator,
		setFrequency: setFrequency,
		setVolume: setVolume,
		setMaxVolume: setMaxVolume,
		makeSound: makeSound,
		stopSound: stopSound
	};
}());

var app = {};
app.controller = (function () {

	// Function to run once page is fully loaded.
	function init() {
		var onOffControl,
			volumeControl,
			frequencyControl;


		function frequencyControlValuetoFrequency(controlValue) {
			//return parseInt(Math.exp(controlValue), 10);
			return parseInt(Math.pow(2, controlValue), 10);
		}

		// Define custom functions to be run on the specified control events.
		function setVolume(volume) {
			if (volume === undefined) volume = volumeControl.getValue();
			audio.controller.setVolume(parseFloat(volume), 10);
			volumeControl.setValue(volume);
			volumeControl.updateDisplayedValue();
		}
		function setFrequency(frequency) {
			if (frequency === undefined) frequency = frequencyControlValuetoFrequency(frequencyControl.getValue());
			audio.controller.setFrequency(frequency);
		}
		function onOff(){
			var value = onOffControl.getValue();
			if (value === 'I am off') {
				onOffControl.setValue('I am on');
				audio.controller.makeSound();
			} else {
				onOffControl.setValue('I am off');
				audio.controller.stopSound();
			}
		}

		// Create the interfaces to the DOM controls.
		onOffControl = controls.controller.create('onOffButton', 'onOffButtonDisplay', 'click', onOff),
		volumeControl = controls.controller.create('volumeSlider', 'volumeDisplay', 'change', setVolume),
		frequencyControl = controls.controller.create('frequencySlider', 'frequencyDisplay', 'change', setFrequency, frequencyControlValuetoFrequency);

		// Update the displayed control values on page load.
		onOffControl.updateDisplayedValue();
		volumeControl.updateDisplayedValue();
		frequencyControl.updateDisplayedValue();

		// Initalise the oscillator
		audio.controller.initOscillator();
		audio.controller.setMaxVolume(volumeControl.getMaxValue());
		setVolume();
		setFrequency();
	}

	return {
		init: init
	};
}());

// Add the event listener which kicks everything off.
window.document.addEventListener('readystatechange', function onPageLoad(event){
	if(document.readyState === 'complete') {
		app.controller.init();
	}
}, false);
