import * as THREE from 'three';
import envelopGenerator from './envelopGenerator.js';					//Envelop Generator
import CCGenerator from './CCGenerator.js';								//Colour System
import timerObject from './timerObject.js';								//Timers
import pixelMaper from './pixelMaper.js';								//Pixel Maper
import animationObject from './animationObject.js';						//Generic Object Tracking class
import ElipticalEnvelopGenerator from './ElipticalEnvelopGenerator.js';
import curvePoint from './threeCurvePoint.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';

class threeCircularCurves
{	
	constructor()
	{
		//Main object stores
		this.objectTape = new Array();
		this.globalGroupArray = new Array();
		this.globalObjectGroup = new THREE.Object3D();
		this.groupName = "CC_";
		this.objectIDIndex = 0;
		this.genObject = new animationObject();
		
		//Global Three Objects form main System
		this.scene;
		
		//Main properties
		this.origin = [0,0,0];
		this.dimensions = [100,100,100];
		this.segments = 8;
		this.splineCurvePoints  = new Array();
		this.pollyFitness = 100;
		this.lineThickness = 1;
		this.lfoSeed = 0;
		this.opacity = 1;
		this.bloomEnable = 1;
		this.bloomEvery = 3;
		this.rotations = [0,0,0];
		this.multiObject = 0;
		this.setUpStatus = 0;
		
		//Utility Objects
		this.pixelMap = new pixelMaper(2,2);
		this.screenRange = [100,100,100];
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
		var splinePoints = 3;
		var segmentLength = this.dimensions[0]/splinePoints;
		this.scene = scene;
		this.colourIndex = colourIndex;
		
		//set up spline points
		this.splineCurvePoints.push(new curvePoint(50,90,70,100));
		this.splineCurvePoints.push(new curvePoint(100,90,60,110));
		this.splineCurvePoints.push(new curvePoint(150,90,50,120));
		this.splineCurvePoints.push(new curvePoint(170,90,40,130));
		this.splineCurvePoints.push(new curvePoint(300,90,0,180));
		
		//motion lfo
		this.lfo.addWithTimeCode("motionLFO", [ 100 ], [10], 0, this.lfoSeed);
		this.lfo.addWithTimeCode("motionZLFO", [ 100 ], [10], 0, this.lfoSeed);

	}
	animate = function(colourControls, controlData, rotationalIncrements=[0,0,0])
	{
		//controlData[0]  object scale
		//controlData[1]  width scale
		//controlData[2]  height scale
		//controlData[3]  depth scale
		//controlData[4]  vertex rotation scaler
		//controlData[5]  line width scale
		//controlData[6]  motion phase
		//controlData[7]  motion speed

		if(this.setUpStatus==0){return;}	
		var objectIndex=0, partIndex=0, vertIndex=0;
		var vertecies = new Array(), tempCurve, lineVertecies, vertArray;
		var motionLFOIndex = this.lfo.getTimeCode("motionLFO"), motionZLFOIndex = this.lfo.getTimeCode("motionZLFO");
		var currentLFOIndex = motionLFOIndex, currentZLFOIndex = motionZLFOIndex;
		var currentAngle = 0, currentDepth = 0;
		
		for(objectIndex=0; objectIndex<this.segments; objectIndex++)
		{
			vertecies = new Array();
			for(vertIndex=0; vertIndex<this.splineCurvePoints.length; vertIndex++)
			{
				currentLFOIndex += controlData[6];
				currentAngle = (this.lfo.read("motionLFO", 0, currentLFOIndex)/100)*this.splineCurvePoints[vertIndex].angleRange;
				currentAngle = this.splineCurvePoints[vertIndex].minAngle+currentAngle;
				this.splineCurvePoints[vertIndex].setAngle(currentAngle);
				currentZLFOIndex += controlData[6];
				currentDepth = (this.lfo.read("motionZLFO", 0, currentZLFOIndex)/100)*this.dimensions[2];
				currentDepth = (-this.dimensions[2]/2)+currentDepth;
				vertecies.push( new THREE.Vector3(this.splineCurvePoints[vertIndex].position[0], this.splineCurvePoints[vertIndex].position[1], currentDepth) );
			}
			currentLFOIndex = motionLFOIndex;
			currentZLFOIndex = motionZLFOIndex;
			tempCurve = new THREE.CatmullRomCurve3( vertecies );
			lineVertecies = tempCurve.getPoints( this.pollyFitness );
			vertArray = new Array();
			for(vertIndex=0; vertIndex<lineVertecies.length; vertIndex++)
			{
				vertArray.push(lineVertecies[vertIndex].x, lineVertecies[vertIndex].y, lineVertecies[vertIndex].z)
			}
			//Geometries
			this.objectTape[objectIndex].geometry[partIndex].setPositions( vertArray );
			//line width
			this.objectTape[objectIndex].materials[partIndex].linewidth = this.lineThickness*controlData[5];
			//colour
			this.colourObject.getColour( this.subColourIndex%this.colourObject._bandWidth );
			this.objectTape[objectIndex].materials[partIndex].color.r = this.colourObject._currentColour[0]/255;
			this.objectTape[objectIndex].materials[partIndex].color.g = this.colourObject._currentColour[1]/255;
			this.objectTape[objectIndex].materials[partIndex].color.b = this.colourObject._currentColour[2]/255;
			this.subColourIndex+=colourControls[1];
		}
		this.lfo.setTimeCode("motionLFO", motionLFOIndex+controlData[7]);
		this.lfo.setTimeCode("motionZLFO", motionZLFOIndex+controlData[7]);
		
		//global rotation		
		this.globalObjectGroup.rotateX( this.angleToRadian(rotationalIncrements[0]) );
		this.globalObjectGroup.rotateY( this.angleToRadian(rotationalIncrements[1]) );
		this.globalObjectGroup.rotateZ( this.angleToRadian(rotationalIncrements[2]) );
		//scale
		this.globalObjectGroup.scale.set(controlData[0]*controlData[1], controlData[0]*controlData[2], controlData[0]*controlData[3]); 

		this.colourIndex += colourControls[0];
		this.subColourIndex = this.colourIndex;
	}
	insertObject = function()
	{
		var objectIndex=0, partIndex=0, vertIndex=0;
		var vertecies = new Array(), tempCurve, lineVertecies, vertArray;
		var localGroup = new THREE.Object3D();
		
		this.subColourIndex = this.colourIndex;
		for(objectIndex=0; objectIndex<this.segments; objectIndex++)
		{
			this.objectTape.push( new animationObject() );
			this.objectTape[objectIndex].objectID = this.groupName+this.objectIDIndex;
			
			vertecies = new Array();
			for(vertIndex=0; vertIndex<this.splineCurvePoints.length; vertIndex++)
			{
				vertecies.push( new THREE.Vector3(this.splineCurvePoints[vertIndex].position[0], this.splineCurvePoints[vertIndex].position[1], this.splineCurvePoints[vertIndex].position[2]) );
			}
			tempCurve = new THREE.CatmullRomCurve3( vertecies );
			lineVertecies = tempCurve.getPoints( this.pollyFitness );
			vertArray = new Array();
			for(vertIndex=0; vertIndex<lineVertecies.length; vertIndex++)
			{
				vertArray.push(lineVertecies[vertIndex].x, lineVertecies[vertIndex].y, lineVertecies[vertIndex].z)
			}
			//Geometries
			this.objectTape[objectIndex].geometry.push(  new LineGeometry() );
			this.objectTape[objectIndex].geometry[partIndex].setPositions( vertArray );
			//Material
			this.objectTape[objectIndex].materials.push( new LineMaterial( {color: 0xffffff, linewidth: this.lineThickness, worldUnits: true, vertexColors: false, alphaToCoverage: false} ) );
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
				if(objectIndex%this.bloomEvery==this.bloomEvery-1)
				{
					this.objectTape[objectIndex].objects[partIndex].layers.enable( 1 );
				}
			}
			this.objectTape[objectIndex].objects[partIndex].rotateZ( this.angleToRadian((360/this.segments)*objectIndex) );
			//add to local group
			localGroup.add( this.objectTape[objectIndex].objects[partIndex] );
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
export default threeCircularCurves;