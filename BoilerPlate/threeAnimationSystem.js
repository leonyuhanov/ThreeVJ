import * as THREE from 'three';
import envelopGenerator from './envelopGenerator.js';					//Envelop Generator
import ElipticalEnvelopGenerator from './ElipticalEnvelopGenerator.js';	//LFO Generator
import CCGenerator from './CCGenerator.js';								//Colour System
import timerObject from './timerObject.js';								//Timers
import pixelMaper from './pixelMaper.js';								//Pixel Maper
import animationObject from './animationObject.js';						//Generic Object Tracking class
import CameraSequencer from './CameraSequencer.js';						//Camera viewpoint sequencer
import MIDIMapper from './MIDIMapper.js';								//Midi Mapper

class threeAnimationSystem
{	
	constructor()
	{
		//primary object storage
		this.animations = new Array();
		this.scenes = new Array();
		this.lighting = new Array();
		this.objectTapeArray = new Array();
		this.functionList = new Array();
		this.midiControls = new Array();
		this.envelopList = new Array();
		this.lfosList = new Array();
		this.cameraDirectors = new Array();
		this.timersList = new Array();
		this.colourArray = new Array();
		this.globalVariableArray = new Array();
		this.orbitalControlsArray = new Array();
		
		//current animation index within each array
		this.current = 0;
		
		//default colour System
		this.maxValue = 255;
		this.maxColourDitherSteps = 128;
		this.colourList = [this.maxValue,0,0,this.maxValue,this.maxValue,0, 0,this.maxValue,0, 0,this.maxValue,this.maxValue, 0,0,this.maxValue, this.maxValue,0,this.maxValue, this.maxValue,this.maxValue,this.maxValue];
		
		//Pad Addresses
		this.padAddressList = [81,82,83,84,85,86,87,88, 71,72,73,74,75,76,77,78, 61,62,63,64,65,66,67,68, 51,52,53,54,55,56,57,58, 41,42,43,44,45,46,47,48, 31,32,33,34,35,36,37,38, 21,22,23,24,25,26,27,28, 11,12,13,14,15,16,17];
		
	}
	add = function(name, duration, setupFunction, animateFunction, padAssign, padColour, lightType)
	{
		//set index for setup
		this.current = this.animations.length;
		//Insert new animation entry
		this.animations.push(new animationEntry(name, duration, this.padAddressList[padAssign], padColour, lightType));
		this.scenes.push(new THREE.Scene());
		this.lighting.push(new Array());
		this.objectTapeArray.push(new Array());
		this.midiControls.push(new MIDIMapper());
		this.envelopList.push(new envelopGenerator());
		this.lfosList.push(new ElipticalEnvelopGenerator());
		this.cameraDirectors.push(new CameraSequencer());
		this.timersList.push(new timerObject());
		this.colourArray.push(new CCGenerator(this.maxColourDitherSteps, this.colourList.length/3, this.colourList));
		this.functionList.push(new animationFunctions(setupFunction, animateFunction));
		this.globalVariableArray.push(new Array());
		this.orbitalControlsArray.push( new Array());
	}
	addGlobalVar = function(varName, variable)
	{
		this.globalVariableArray[this.current].push([varName, variable]);
	}
	getGlobalVar = function(varName)
	{
		var varCounter=0;
		for(varCounter=0; varCounter<this.globalVariableArray[this.current].length; varCounter++)
		{
			if(this.globalVariableArray[this.current][varCounter][0]==varName)
			{
				return this.globalVariableArray[this.current][varCounter][1];
			}
		}
	}
	setGlobalVar = function(varName, variable)
	{
		var varCounter=0;
		for(varCounter=0; varCounter<this.globalVariableArray[this.current].length; varCounter++)
		{
			if(this.globalVariableArray[this.current][varCounter][0]==varName)
			{
				this.globalVariableArray[this.current][varCounter][1] = variable;
			}
		}
	}
	index = function(animationName)
	{
		var aCounter;
		for(aCounter=0; aCounter<this.animations.length; aCounter++)
		{
			if(this.animations[aCounter].name==animationName)
			{
				return aCounter;
			}
		}
		return -1;
	}
	//sequencing
	next = function(camera, verbose=false)
	{
		//timeout current animation
		this.animations[this.current].timer.startTimer("duration", 1);
		//save current view port
		this.orbitalControlsArray[this.current][0] = [camera.position.x, camera.position.y, camera.position.z];
		//increment to next
		this.current = (this.current+1)%this.animations.length;
		//set timeout timer for current
		this.animations[this.current].timer.startTimer("duration", this.animations[this.current].duration*1000);
		//restore previoulsy saved view port
		camera.position.set(this.orbitalControlsArray[this.current][0][0], this.orbitalControlsArray[this.current][0][1], this.orbitalControlsArray[this.current][0][2]);
		camera.fov = this.getGlobalVar("cameraFOV");
		camera.updateProjectionMatrix();
		if(verbose)
		{
			console.log("Current animation index["+this.current+"]\t["+this.animations[this.current].name+"]");
		}
	}
	previous = function(camera, verbose=false)
	{
		//timeout current animation
		this.animations[this.current].timer.startTimer("duration", 1);
		//save current view port
		this.orbitalControlsArray[this.current][0] = [camera.position.x, camera.position.y, camera.position.z];
		//decrment to previous
		if(this.current==0)
		{
			this.current = this.animations.length-1;
		}
		else
		{
			this.current = (this.current-1)%this.animations.length;
		}
		//set timeout timer for current
		this.animations[this.current].timer.startTimer("duration", this.animations[this.current].duration*1000);
		//restore previoulsy saved view port
		camera.position.set(this.orbitalControlsArray[this.current][0][0], this.orbitalControlsArray[this.current][0][1], this.orbitalControlsArray[this.current][0][2]);
		camera.fov = this.getGlobalVar("cameraFOV");
		camera.updateProjectionMatrix();
		if(verbose)
		{
			console.log("Current animation index["+this.current+"]\t["+this.animations[this.current].name+"]");
		}
	}
	gotoIndex = function(camera, index, verbose=false)
	{
		//timeout current animation
		this.animations[this.current].timer.startTimer("duration", 1);
		//save current view port
		this.orbitalControlsArray[this.current][0] = [camera.position.x, camera.position.y, camera.position.z];
		//Goto animation at index
		this.current = index%this.animations.length;
		//set timeout timer for current
		this.animations[this.current].timer.startTimer("duration", this.animations[this.current].duration*1000);
		camera.position.set(this.orbitalControlsArray[this.current][0][0], this.orbitalControlsArray[this.current][0][1], this.orbitalControlsArray[this.current][0][2]);
		camera.fov = this.getGlobalVar("cameraFOV");
		camera.updateProjectionMatrix();
		if(verbose)
		{
			console.log("Current animation index["+this.current+"]\t["+this.animations[this.current].name+"]");
		}
	}
	gotoName = function(camera, animationName, verbose=false)
	{
		var index = this.index(animationName);
		if(index!=-1)
		{
			this.gotoIndex(camera, index, verbose);
		}
		else
		{
			console.log("Animation ["+animationName+"] Not found.");
		}
	}
	//easy access
	animation = function()
	{
		return this.animations[this.current];
	}
	scene  = function()
	{
		return this.scenes[this.current];
	}
	lights = function()
	{
		return this.lighting[this.current];
	}
	objectTape = function()
	{
		return this.objectTapeArray[this.current];
	}
	midi = function()
	{
		return this.midiControls[this.current];
	}
	envelops = function()
	{
		return this.envelopList[this.current];
	}
	lfos = function()
	{
		return this.lfosList[this.current];
	}
	cd = function()
	{
		return this.cameraDirectors[this.current];
	}
	timers = function()
	{
		return this.timersList[this.current];
	}
	colours = function()
	{
		return this.colourArray[this.current];
	}
	functions  = function()
	{
		return this.functionList[this.current];
	}
	orbitalControls = function()
	{
		return this.orbitalControlsArray[this.current];
	}
}
//---------------	Helper object to store animations details	---------------
class animationEntry
{
	//lightType S: static	F: flashing		P: slow pulse
	constructor(name, duration, padAssign, padColour=5, lightType="S")
	{
		this.name = name;
		this.padAssign = padAssign;
		this.padColour = padColour;
		this.lightType = lightType;
		this.duration = duration;
		this.timer = new timerObject();
		this.init();
	}
	init = function()
	{
		this.timer.addTimer("duration");
		this.timer.startTimer("duration", 1);
	}
}
//-----------------------------------------------------------------------------
//---------------	helper object to store animation functions	---------------
class animationFunctions
{
	constructor(setup, animate)
	{
		this.setup = setup;
		this.animate = animate;
	}
}
//-----------------------------------------------------------------------------
export default threeAnimationSystem;