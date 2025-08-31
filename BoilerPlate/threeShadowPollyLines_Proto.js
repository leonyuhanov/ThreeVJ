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

class threeShadowPollyLines
{	
	constructor()
	{
		//Main object stores
		this.objectTape = new Array();
		this.globalGroupArray = new Array();
		this.globalObjectGroup = new THREE.Object3D();
		this.groupName = "SPL_";
		this.objectIDIndex = 0;
		this.genObject = new animationObject();
		
		//Global Three Objects form main System
		this.scene;
		
		//Main properties
		this.origin = [0,0,0];
		this.pollyPoints = 6;
		this.dimensions = [100, 100, 120, 120];	//inner elipse, outer elipse
		this.shadowCount = 10;
		this.depth = 50;
		this.pollyStartAngle = 0;
		this.lfoSeed = 0;
		this.bloomEnable = 0;
		this.bloomOn = 3;
		this.defaultOpacity = 1;
		this.defaultLineWidth = 1;
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
		this.subColourIndex = this.colourIndex;
		this.lfo.addWithTimeCode("opacityLFO", [ 100 ], [100], 0, 0);
		this.lfo.addWithTimeCode("depthLFO", [ 100 ], [100], 0, this.lfoSeed);
		this.lfo.addWithTimeCode("rotationLFO", [ 100, -100 ], [100, 100], 0, 0);
	}
	animate = function(colourControls, controlData, rotationalIncrements=[0,0,0])
	{
		//controlData[0]  object scale
		//controlData[1]  width scale
		//controlData[2]  height scale
		//controlData[3]  depth scale
		//controlData[4]  line width scaler
		//controlData[5]  Depth LFO Phase
		//controlData[6]  Depth LFO Speed
		//controlData[7]  Rotation LFO Phase
		//controlData[8]  Rotation LFO Speed
		
		if(this.setUpStatus==0){return;}
		
		var objectIndex=0, partIndex=0;
		var currentDepth = 0, currentDepthRange = 0, currentRotation=0;
		var depthLFOStartTimeCode = this.lfo.getTimeCode("depthLFO"), rotationLFOStartTimeCode = this.lfo.getTimeCode("rotationLFO");
		var depthLFOTimeCode = depthLFOStartTimeCode, rotationLFOTimeCode = rotationLFOStartTimeCode;
		
		for(partIndex=0; partIndex<this.objectTape[objectIndex].objects.length; partIndex++)
		{
			//depth
			//currentDepth = (-this.depth)+((this.depth*2)*(this.lfo.read("depthLFO", 0, depthLFOTimeCode)/100));
			currentDepthRange = this.depth-((partIndex/this.shadowCount)*this.depth);
			currentDepth = (-(currentDepthRange/2))+(currentDepthRange*(this.lfo.read("depthLFO", 0, depthLFOTimeCode)/100));
			this.objectTape[objectIndex].objects[partIndex].position.z = currentDepth;
			depthLFOTimeCode += controlData[5];
			
			//line thickness
			this.objectTape[objectIndex].materials[partIndex].linewidth = this.defaultLineWidth*controlData[4];
			//rotation
			currentRotation = (this.lfo.read("rotationLFO", 0, rotationLFOTimeCode)/100)*0.2;
			this.objectTape[objectIndex].objects[partIndex].rotateZ( this.angleToRadian(currentRotation) );
			rotationLFOTimeCode += controlData[7];
			//colour
			this.setMaterialColour(this.objectTape[objectIndex].materials[partIndex], this.subColourIndex);
			this.subColourIndex += colourControls[1];
		}
		this.lfo.setTimeCode("depthLFO", depthLFOStartTimeCode+controlData[6]);
		this.lfo.setTimeCode("rotationLFO", rotationLFOStartTimeCode+controlData[8]);
		
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
		var objectIndex=0, partIndex=0, vertIndex=0, vertAngle=0, currentRadaius = [0,0];
		var vertecies, pointPos; 
		var totalPollys = this.shadowCount+2;
		var radialRanges = [ (this.dimensions[2]-this.dimensions[0])/totalPollys , (this.dimensions[3]-this.dimensions[1])/totalPollys];
		var localGroup = new THREE.Object3D();
				
		this.objectTape.push( new animationObject() );
		this.objectTape[objectIndex].objectID = this.groupName+this.objectIDIndex;
		for(partIndex=0; partIndex<totalPollys; partIndex++)
		{
			//create polly
			vertecies = new Array();
			for(vertIndex=0; vertIndex<this.pollyPoints; vertIndex++)
			{
				//Standard Circular POlly Shape
				vertAngle = ((360/this.pollyPoints)*vertIndex)+this.pollyStartAngle;
				currentRadaius[0] = this.dimensions[0]+(radialRanges[0]*partIndex);
				currentRadaius[1] = this.dimensions[1]+(radialRanges[1]*partIndex);
				
				pointPos = this.pixelMap.getElipticalPointsRaw(0, 0, currentRadaius[0], currentRadaius[1], vertAngle);
				vertecies.push(pointPos[0], pointPos[1], 0);
				
			}
			vertecies.push(vertecies[0], vertecies[1], vertecies[2]);
			//Object creation
			//Geometries
			this.objectTape[objectIndex].geometry.push(  new LineGeometry() );
			this.objectTape[objectIndex].geometry[partIndex].setPositions( vertecies );
			this.objectTape[objectIndex].materials.push( new LineMaterial( {color: 0xffffff, linewidth: this.defaultLineWidth, worldUnits: true, vertexColors: false, alphaToCoverage: false} ) );
			this.objectTape[objectIndex].materials[partIndex].transparent = true;
			//colour
			this.setMaterialColour(this.objectTape[objectIndex].materials[partIndex], this.subColourIndex);
			this.objectTape[objectIndex].objects.push( new THREE.Mesh(this.objectTape[objectIndex].geometry[partIndex], this.objectTape[objectIndex].materials[partIndex]) );
			//bloom
			if(this.bloomEnable==1 && partIndex%this.bloomOn==this.bloomOn-1)
			{
				this.objectTape[objectIndex].objects[partIndex].layers.enable( 1 );
			}
			//add to local group
			localGroup.add( this.objectTape[objectIndex].objects[partIndex] );
			
			//1st polly and last polly
			if(partIndex==0 || partIndex+1==totalPollys-1)
			{
				this.objectTape[objectIndex].materials[partIndex].opacity = this.defaultOpacity;
			}
			//inner Pollys
			else
			{
				this.objectTape[objectIndex].materials[partIndex].opacity = ((this.lfo.read("opacityLFO", 0, 50+((100/totalPollys)*partIndex))/100)+0.1);
				//this.objectTape[objectIndex].materials[partIndex].linewidth = ((this.lfo.read("opacityLFO", 0, 50+((100/totalPollys)*partIndex))/100)*this.defaultLineWidth)+1;
			}
			
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
	setMaterialColour = function(materialObject, colourIndex)
	{
		this.colourObject.getColour( colourIndex%this.colourObject._bandWidth );
		materialObject.color.r = this.colourObject._currentColour[0]/255;
		materialObject.color.g = this.colourObject._currentColour[1]/255;
		materialObject.color.b = this.colourObject._currentColour[2]/255;
	}
}
export default threeShadowPollyLines;