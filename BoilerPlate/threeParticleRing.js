import * as THREE from 'three';
import envelopGenerator from './envelopGenerator.js';					//Envelop Generator
import CCGenerator from './CCGenerator.js';								//Colour System
import timerObject from './timerObject.js';								//Timers
import pixelMaper from './pixelMaper.js';								//Pixel Maper
import animationObject from './animationObject.js';						//Generic Object Tracking class
import ElipticalEnvelopGenerator from './ElipticalEnvelopGenerator.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';

class threeParticleRing
{	
	constructor()
	{
		//Main object stores
		this.objectTape = new Array();
		this.globalGroupArray = new Array();
		this.globalObjectGroup = new THREE.Object3D();
		this.groupName = "PR_";
		this.objectIDIndex = 0;
		this.genObject = new animationObject();
		
		//Global Three Objects form main System
		this.scene;
		
		//Main properties
		this.origin = [0,0,0];
		this.dimensions = [100, 100, 10];	//main orbit ring
		this.particleCount = 100;
		this.particleSize = 1;
		this.particleOpacity = 1;
		this.lfoSeed = 0;
		this.bloomEnable = 0;
		this.pollyFiness = 720;
		this.rotations = [0,0,0];
		this.multiObject = 0;
		this.setUpStatus = 0;
		
		//Utility Objects
		this.pixelMap = new pixelMaper(2,2);
		this.screenRange = [500,300,200];
		this.timers = new timerObject();
		this.envelops = new envelopGenerator();
		this.lfo = new ElipticalEnvelopGenerator();
		this.directionalVectors = [1,1,1];
		this.rotateTo = [0,0,0];
		this.rotationalSpeed = [1,1,1];
		this.sprite = new THREE.TextureLoader().load( './BoilerPlate/disc.png' );
		
		//Colour System
		this.colourIndex = 0;
		this.subColourIndex = 0;
		this.creationColourIncrement = 10;
		this.maxValue = 255;
		this.maxColourDitherSteps = 128;
		this.colourList_1 = [this.maxValue,0,0,this.maxValue,this.maxValue,0, 0,this.maxValue,0, 0,this.maxValue,this.maxValue, 0,0,this.maxValue, this.maxValue,0,this.maxValue, this.maxValue,this.maxValue,this.maxValue];
		this.colourObject = new CCGenerator(this.maxColourDitherSteps, this.colourList_1.length/3, this.colourList_1);
		this.defaultColour = 0xffffff;
	}
	init = function(scene, colourIndex)
	{
		this.scene = scene;
		this.colourIndex = colourIndex;
		this.subColourIndex = this.colourIndex;
		this.sprite.colorSpace = THREE.SRGBColorSpace;
		this.lfo.addWithTimeCode("pullLFO", [100, -100], [100, 100], 0, this.lfoSeed);
		this.lfo.addWithTimeCode("depthLFO", [100, -100], [100, 100], 0, this.lfoSeed);
		this.lfo.addWithTimeCode("burstLFO", [100, -100], [50, 100], 2, 0);
	}
	animate = function(colourControls, controlData, rotationalIncrements=[0,0,0])
	{
		//controlData[0]  object scale
		//controlData[1]  width scale
		//controlData[2]  height scale
		//controlData[3]  depth scale
		//controlData[4]  particle scale
		//controlData[5]  motion speed
		//controlData[6]  pull modifier lfo Phase
		//controlData[7]  pull depth modifier lfo speed
		//controlData[8]  pull depth range scaler
		//controlData[9]  depth range modifier lfo speed
		//controlData[10]  depth range scaler
		//controlData[11]  depth modifier lfo Phase
		//controlData[12]  burst trigger
		//controlData[13]  burst rate
		
		if(this.setUpStatus==0){return;}				
		var objectIndex=0, partIndex=0, vertIndex=0, vertecies = new Array(), pointPos;
		var currentTimeCode = this.lfo.getTimeCode("pullLFO"), currentDepthTimeCode = this.lfo.getTimeCode("depthLFO");
		var startTimeCode = currentTimeCode, startDepthTimeCode = currentDepthTimeCode, pullRange=0, depthRange=0;
		var tempPullRange = 0, tempDepthRange=0, currentBurstLFO = (this.lfo.read("burstLFO", controlData[13], 0)/100);
		
		//check burst trigger
		if(controlData[12]==1)
		{
			this.lfo.setOneShotState("burstLFO", 1, 0);
		}
		
		//particle size
		this.objectTape[objectIndex].materials[partIndex].size = this.particleSize*controlData[4];
		//Colour
		this.setMaterialColour(this.objectTape[objectIndex].materials[partIndex], this.colourIndex)
		//particle motion
		for(vertIndex=0; vertIndex<this.objectTape[objectIndex].pointData.length; vertIndex++)
		{
			//motion around orbit
			this.objectTape[objectIndex].pointData[vertIndex][3]+=controlData[5];
			//lfo controlled motion around depth range
			tempPullRange = controlData[8]*(1-currentBurstLFO);
			tempDepthRange = controlData[11]*(1-currentBurstLFO);
			pullRange = (this.dimensions[2]*tempPullRange)*(this.lfo.read("pullLFO", 0, currentTimeCode)/100);
			depthRange = (this.dimensions[2]*tempDepthRange)*(this.lfo.read("depthLFO", 0, currentDepthTimeCode)/100);
			currentTimeCode += controlData[6];
			currentDepthTimeCode += controlData[9];
			pointPos = this.pixelMap.getElipticalPointsRaw(0,0,this.dimensions[0]+pullRange,this.dimensions[1]+pullRange, this.objectTape[objectIndex].pointData[vertIndex][3]);
			vertecies.push(pointPos[0], pointPos[1], depthRange);
		}
		//update lfo
		this.lfo.setTimeCode("pullLFO", startTimeCode+controlData[7]);
		this.lfo.setTimeCode("depthLFO", startDepthTimeCode+controlData[10]);
		//update gemoteries
		this.objectTape[objectIndex].geometry[partIndex].dispose();
		this.objectTape[objectIndex].geometry[partIndex].setAttribute( 'position', new THREE.Float32BufferAttribute( vertecies , 3 ) );
		
		//global rotation		
		this.globalObjectGroup.rotateX( this.angleToRadian(this.rotationalSpeed[0]*rotationalIncrements[0]) );
		this.globalObjectGroup.rotateY( this.angleToRadian(this.rotationalSpeed[1]*rotationalIncrements[1]) );
		this.globalObjectGroup.rotateZ( this.angleToRadian(this.rotationalSpeed[2]*rotationalIncrements[2]) );
		//scale
		this.globalObjectGroup.scale.set(controlData[0]*controlData[1], controlData[0]*controlData[2], controlData[0]*controlData[3]); 

		this.colourIndex += colourControls[0];
		this.subColourIndex = this.colourIndex;
	}
	
	insertObject = function()
	{
		var objectIndex=0, partIndex=0;
		var pointPos, vertIndex, vertecies = new Array();
		var localGroup = new THREE.Object3D();
				
		this.objectTape.push( new animationObject() );
		this.objectTape[objectIndex].objectID = this.groupName+this.objectIDIndex;		
		//create the circlar cloud
		for(vertIndex=0; vertIndex<this.particleCount; vertIndex++)
		{
			//width, height, depth range, angular location
			this.objectTape[objectIndex].pointData.push([0,0,Math.random()*this.dimensions[2], Math.random()*360]);
			pointPos = this.pixelMap.getElipticalPointsRaw(0,0,this.dimensions[0],this.dimensions[1], this.objectTape[objectIndex].pointData[vertIndex][3]);
			vertecies.push(pointPos[0], pointPos[1], this.objectTape[objectIndex].pointData[vertIndex][2]);
		}
		//Geometries
		this.objectTape[objectIndex].geometry.push( new THREE.BufferGeometry() );
		this.objectTape[objectIndex].geometry[partIndex].setAttribute( 'position', new THREE.Float32BufferAttribute( vertecies , 3 ) );
		this.objectTape[objectIndex].materials.push( new THREE.PointsMaterial( { color: 0xffffff, size: this.particleSize, map: this.sprite, alphaTest: 0.5, transparent: true} ) );
		//colour
		this.setMaterialColour(this.objectTape[objectIndex].materials[partIndex], this.subColourIndex);
		this.objectTape[objectIndex].objects.push( new THREE.Points(this.objectTape[objectIndex].geometry[partIndex], this.objectTape[objectIndex].materials[partIndex]) );
		//bloom
		if(this.bloomEnable==1)
		{
			this.objectTape[objectIndex].objects[partIndex].layers.enable( 1 );
		}
		//add to local group
		localGroup.add( this.objectTape[objectIndex].objects[partIndex] );	
		
		//reset colour index
		this.subColourIndex = this.colourIndex;
		//rotations
		localGroup.rotateX( this.angleToRadian( this.rotateTo[0] ) );
		localGroup.rotateY( this.angleToRadian( this.rotateTo[1] ) );
		localGroup.rotateZ( this.angleToRadian( this.rotateTo[2] ) );
		//finalize objects
		this.globalGroupArray.push( localGroup );
		this.globalObjectGroup.add( localGroup );
		//Finalize position
		this.globalObjectGroup.position.x =  this.origin[0];
		this.globalObjectGroup.position.y =  this.origin[1];
		this.globalObjectGroup.position.z =  this.origin[2];
		//add to global scene
		if(this.multiObject==0)
		{
			this.scene.add( this.globalObjectGroup );
		}
		this.setUpStatus = 1;
	}
	
	generatedirectionalVectors = function()
	{
		if( Math.round(Math.random()) == 1 ){this.directionalVectors[0]=1;}else{this.directionalVectors[0]=-1;}
		if( Math.round(Math.random()) == 1 ){this.directionalVectors[1]=1;}else{this.directionalVectors[1]=-1;}
		if( Math.round(Math.random()) == 1 ){this.directionalVectors[2]=1;}else{this.directionalVectors[2]=-1;}
	}
	seed = function(originPoint)
	{
		if(originPoint==undefined)
		{
			this.origin[0] = (-this.screenRange[0])+Math.round(Math.random()*(this.screenRange[0]*2));
			this.origin[1] = (this.screenRange[1])-Math.round(Math.random()*(this.screenRange[1]*2));
			this.origin[2] = (-this.screenRange[2])+Math.round(Math.random()*(this.screenRange[2]*2));
		}
		else
		{
			this.origin[0] = originPoint[0];
			this.origin[1] = originPoint[1];
			this.origin[2] = originPoint[2];
		}
		this.insertObject();
	}
	angleToRadian = function(angle)
	{
		return (angle%360)*(Math.PI/180);
	}
	angleToFloatAngle = function(angle)
	{
		return (angle%360)/360;
	}
	floatAngleToAngle = function (floatAngle)
	{
		return floatAngle*360;
	}
	setMaterialColour = function(materialObject, colourIndex)
	{
		this.colourObject.getColour( colourIndex%this.colourObject._bandWidth );
		materialObject.color.r = this.colourObject._currentColour[0]/255;
		materialObject.color.g = this.colourObject._currentColour[1]/255;
		materialObject.color.b = this.colourObject._currentColour[2]/255;
	}
}
export default threeParticleRing;