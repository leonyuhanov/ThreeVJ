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

class threePhatLines
{	
	constructor()
	{
		//Main object stores
		this.objectTape = new Array();
		this.globalGroupArray = new Array();
		this.globalObjectGroup = new THREE.Object3D();
		this.groupName = "PLR_";
		this.objectIDIndex = 0;
		this.genObject = new animationObject();
		
		//Global Three Objects form main System
		this.scene;
		
		//Main properties
		this.origin = [0,0,0];
		this.dimensions = [100, 100, 100];
		this.pollyFitness = 64;
		this.lineLengthInDegrees = 10;
		this.pollyCount = 1;
		this.zSpace = 10;
		this.opacity = 1;
		this.lfoSeed = 0;
		this.angleSeed = 0;
		this.bloomEnable = 0;
		this.multiObject = 0;
		this.setUpStatus = 0;
		
		//Utility Objects
		this.pixelMap = new pixelMaper(2,2);
		this.screenRange = [300,200,300];
		this.timers = new timerObject();
		this.envelops = new envelopGenerator();
		this.lfo = new ElipticalEnvelopGenerator();
		this.directionalVectors = [1,1,1];
		this.rotateTo = [0,0,0];
		this.modify = 0;
		
		//Colour System
		this.colourIndex = 0;
		this.subColourIndex = 0;
		this.creationColourIncrement = 10;
		this.maxValue = 255;
		this.maxColourDitherSteps = 128;
		this.colourList_1 = [this.maxValue,0,0,this.maxValue,this.maxValue,0, 0,this.maxValue,0, 0,this.maxValue,this.maxValue, 0,0,this.maxValue, this.maxValue,0,this.maxValue, this.maxValue,this.maxValue,this.maxValue];
		this.colourObject = new CCGenerator(this.maxColourDitherSteps, this.colourList_1.length/3, this.colourList_1);
	}
	init = function(scene, colourIndex)
	{
		this.scene = scene;
		this.colourIndex = colourIndex;
	}
	animate = function(colourControls, controlData, rotationalIncrements=[0,0,0])
	{
		//controlData[0]  object scale
		//controlData[1]  width scale
		//controlData[2]  height scale
		//controlData[3]  depth scale
		//controlData[4]  line width scale
		//controlData[5]  line rotation scale
		
		if(this.setUpStatus==0){return;}

		var objectIndex=0, partIndex=0;
		
		for(objectIndex=0; objectIndex<this.objectTape.length; objectIndex++)
		{
			this.objectTape[objectIndex].materials[partIndex].linewidth = controlData[4]
			//colour
			this.colourObject.getColour( this.subColourIndex%this.colourObject._bandWidth );
			this.objectTape[objectIndex].materials[partIndex].color.r = this.colourObject._currentColour[0]/255;
			this.objectTape[objectIndex].materials[partIndex].color.g = this.colourObject._currentColour[1]/255;
			this.objectTape[objectIndex].materials[partIndex].color.b = this.colourObject._currentColour[2]/255;
			this.subColourIndex+=colourControls[1];
			//rotation
			this.objectTape[objectIndex].objects[partIndex].rotateZ( this.angleToRadian( this.objectTape[objectIndex].rotations[2]*controlData[5] ) );			
		}

		//global Scale
		this.globalObjectGroup.scale.set(controlData[0]*controlData[1], controlData[0]*controlData[2], controlData[0]*controlData[3]);
		//global rotation
		this.globalObjectGroup.rotateX( this.angleToRadian(rotationalIncrements[0]) );
		this.globalObjectGroup.rotateY( this.angleToRadian(rotationalIncrements[1]) );
		this.globalObjectGroup.rotateZ( this.angleToRadian(rotationalIncrements[2]) );	

		this.colourIndex += colourControls[0];
		this.subColourIndex = this.colourIndex;
	}
	insertObject = function()
	{
		var objectIndex=0, partIndex=0, vertIndex=0, aStart=0;
		var pointPos = [0,0];
		var vertecies = new Array();
		var localGroup = new THREE.Object3D();
		var zStart = -this.dimensions[2];
		
		this.zSpace = (this.dimensions[2]*2)/this.pollyCount;
		
		this.subColourIndex = this.colourIndex;
		//one object per angular point
		for(objectIndex=0; objectIndex<this.pollyCount; objectIndex++)
		{
			this.objectTape.push( new animationObject() );
			this.objectTape[objectIndex].objectID = this.groupName+this.objectIDIndex;
			//Rotation
			this.generatedirectionalVectors();
			this.objectTape[objectIndex].rotations[2] = this.directionalVectors[2]*(Math.random()+0.01);
			//vertex generator
			vertecies = new Array();
			aStart = (this.pollyFitness*(this.lineLengthInDegrees/360))*objectIndex;
			for(vertIndex=aStart; vertIndex<aStart+(this.pollyFitness*(this.lineLengthInDegrees/360)); vertIndex++)
			{
				pointPos = this.pixelMap.getElipticalPointsRaw(0, 0, this.dimensions[0], this.dimensions[1], (360/this.pollyFitness)*vertIndex);
				vertecies.push(pointPos[0], pointPos[1], zStart);
			}
			//Geometries
			this.objectTape[objectIndex].geometry.push(  new LineGeometry() );
			this.objectTape[objectIndex].geometry[partIndex].setPositions( vertecies );
			//Material
			this.objectTape[objectIndex].materials.push( new LineMaterial( {color: 0xffffff, linewidth: 2, worldUnits: true, vertexColors: false, alphaToCoverage: false} ) );
			this.objectTape[objectIndex].materials[partIndex].transparent = true;
			this.objectTape[objectIndex].materials[partIndex].opacity = this.opacity;
			//colour
			this.colourObject.getColour( this.subColourIndex%this.colourObject._bandWidth );
			this.objectTape[objectIndex].materials[partIndex].color.r = this.colourObject._currentColour[0]/255;
			this.objectTape[objectIndex].materials[partIndex].color.g = this.colourObject._currentColour[1]/255;
			this.objectTape[objectIndex].materials[partIndex].color.b = this.colourObject._currentColour[2]/255;
			//Object
			this.objectTape[objectIndex].objects.push( new Line2(this.objectTape[objectIndex].geometry[partIndex], this.objectTape[objectIndex].materials[partIndex]) );
			if(this.bloomEnable==1)
			{
				this.objectTape[objectIndex].objects[partIndex].layers.enable( 1 );
			}
			//add to local group
			localGroup.add( this.objectTape[objectIndex].objects[partIndex] );
			this.objectIDIndex++;
			this.subColourIndex += this.creationColourIncrement;
			//Zlocation
			zStart+=this.zSpace;
		}
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
}
export default threePhatLines;