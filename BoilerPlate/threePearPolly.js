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

class threePearPolly
{	
	constructor()
	{
		//Main object stores
		this.objectTape = new Array();
		this.globalGroupArray = new Array();
		this.globalObjectGroup = new THREE.Object3D();
		this.groupName = "TPP_";
		this.objectIDIndex = 0;
		this.genObject = new animationObject();
		
		//Global Three Objects form main System
		this.scene;
		
		//Main properties
		this.origin = [0,0,0];
		this.dimensions = [100,100];
		this.lineThickness = 1;
		this.pollyFitness = 256;
		this.pollyCount = 4;
		this.pointCloudCount = 50;
		this.pointOffset = 0.5;
		this.lfoSeed = 0;
		this.bloomEnable = 0;
		this.defaultOpacity = 1;
		this.bloomOn = 3;
		this.rotations = [0,0,0];
		this.multiObject = 0;
		this.setUpStatus = 0;
		
		//Utility Objects
		this.pixelMap = new pixelMaper(2,2);
		this.screenRange = [300,300,200];
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
	}
	init = function(scene, colourIndex)
	{
		this.scene = scene;
		this.colourIndex = colourIndex;
		this.subColourIndex = this.colourIndex;
		//this.lfo.addWithTimeCode("lineWidth", [ 100 ], [100], 0, this.lfoSeed);
		this.sprite.colorSpace = THREE.SRGBColorSpace;
	}
	animate = function(colourControls, controlData, rotationalIncrements=[0,0,0])
	{
		//controlData[0]  object scale
		//controlData[1]  width scale
		//controlData[2]  height scale
		//controlData[3]  depth scale
		//controlData[4]  line width scale
		//controlData[5]  point speed
		//controlData[6]  cetrepoint offset

		if(this.setUpStatus==0){return;}
		var objectIndex=0, partIndex=0, vertIndex=0, centreOffset=this.pointOffset*controlData[6];
		var vertecies, tempCurve, lineVectors, pointPos;
		var lowPoint;

		for(partIndex=0; partIndex<this.pollyCount; partIndex++)
		{
			lineVectors = new Array();
			for(vertIndex=270; vertIndex>90; vertIndex--)
			{
				pointPos = this.pixelMap.getElipticalPointsRaw(0, 0, this.dimensions[0], this.dimensions[1], vertIndex);
				lineVectors.push( new THREE.Vector3(pointPos[0], pointPos[1], 0) );
			}
			//get low point at 0 angle with double radius
			lowPoint = this.pixelMap.getElipticalPointsRaw(0, 0, this.dimensions[0]*centreOffset, this.dimensions[1]*centreOffset, 0);
			pointPos = this.pixelMap.getElipticalPointsRaw(lowPoint[0], lowPoint[1], this.dimensions[0], this.dimensions[1], 180-45);
			lineVectors.push( new THREE.Vector3(pointPos[0], pointPos[1], 0) );
			lineVectors.push( new THREE.Vector3(lowPoint[0], lowPoint[1], 0) );
			pointPos = this.pixelMap.getElipticalPointsRaw(lowPoint[0], lowPoint[1], this.dimensions[0], this.dimensions[1], 180+45);
			lineVectors.push( new THREE.Vector3(pointPos[0], pointPos[1], 0) );
			lineVectors.push( lineVectors[0] );
			this.objectTape[objectIndex].pointData[partIndex] =  lineVectors;
		}
		
		//point motion
		objectIndex++;
		this.subColourIndex = this.colourIndex;
		lowPoint = this.pixelMap.getElipticalPointsRaw(0, 0, this.dimensions[0]*centreOffset, this.dimensions[1]*centreOffset, 0);
		for(partIndex=0; partIndex<this.pollyCount; partIndex++)
		{
			tempCurve = new THREE.CatmullRomCurve3( this.objectTape[0].pointData[partIndex] );
			vertecies = new Array();
			for(vertIndex=0; vertIndex<this.pointCloudCount; vertIndex++)
			{
				
				/*
				if(this.objectTape[objectIndex].pointData[partIndex][vertIndex] + ((controlData[5]*(1/this.pollyFitness))*this.objectTape[objectIndex].extrude[partIndex]) >=1)
				{
					this.objectTape[objectIndex].pointData[partIndex][vertIndex] = (controlData[5]*(1/this.pollyFitness));
				}
				else if(this.objectTape[objectIndex].pointData[partIndex][vertIndex] + ((controlData[5]*(1/this.pollyFitness))*this.objectTape[objectIndex].extrude[partIndex]) <= 0)
				{
					this.objectTape[objectIndex].pointData[partIndex][vertIndex] = 1-(controlData[5]*(1/this.pollyFitness));
				}
				else
				{
					this.objectTape[objectIndex].pointData[partIndex][vertIndex] += ((controlData[5]*(1/this.pollyFitness))*this.objectTape[objectIndex].extrude[partIndex]);
				}
				*/
				this.objectTape[objectIndex].pointData[partIndex][vertIndex] += (controlData[5]*(1/this.pollyFitness));
				vertecies.push( tempCurve.getPointAt( this.objectTape[objectIndex].pointData[partIndex][vertIndex]%1 ) );
			}
			//Geometries
			this.objectTape[objectIndex].geometry[partIndex].dispose();
			this.objectTape[objectIndex].geometry[partIndex].setFromPoints(  vertecies );
			this.objectTape[objectIndex].geometry[partIndex].applyMatrix4( new THREE.Matrix4().makeTranslation( 0, -lowPoint[1], 0 ) );
			//colour
			this.setMaterialColour(this.objectTape[objectIndex].materials[partIndex], this.subColourIndex);
			this.subColourIndex += colourControls[1];
		}
		
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
		var objectIndex=0, partIndex=0, vertIndex=0, tempPos;
		var pointPos, lowPoint;
		var vertecies, tempCurve, lineVectors, pointData;
		var localGroup = new THREE.Object3D();
		
		//create main polly shape
		this.objectTape.push( new animationObject() );
		this.objectTape[objectIndex].objectID = this.groupName+this.objectIDIndex;
		for(partIndex=0; partIndex<this.pollyCount; partIndex++)
		{
			vertecies = new Array();
			lineVectors = new Array();
			for(vertIndex=270; vertIndex>90; vertIndex--)
			{
				pointPos = this.pixelMap.getElipticalPointsRaw(0, 0, this.dimensions[0], this.dimensions[1], vertIndex);
				vertecies.push( pointPos[0], pointPos[1], 0);
				lineVectors.push( new THREE.Vector3(pointPos[0], pointPos[1], 0) );
			}
			//get low point at 0 angle with double radius
			lowPoint = this.pixelMap.getElipticalPointsRaw(0, 0, this.dimensions[0]*1.5, this.dimensions[1]*1.5, 0);
			pointPos = this.pixelMap.getElipticalPointsRaw(lowPoint[0], lowPoint[1], this.dimensions[0], this.dimensions[1], 180-45);
			vertecies.push( pointPos[0], pointPos[1], 0 );
			lineVectors.push( new THREE.Vector3(pointPos[0], pointPos[1], 0) );
			vertecies.push( lowPoint[0], lowPoint[1], 0 );
			lineVectors.push( new THREE.Vector3(lowPoint[0], lowPoint[1], 0) );
			pointPos = this.pixelMap.getElipticalPointsRaw(lowPoint[0], lowPoint[1], this.dimensions[0], this.dimensions[1], 180+45);
			vertecies.push( pointPos[0], pointPos[1], 0 );
			lineVectors.push( new THREE.Vector3(pointPos[0], pointPos[1], 0) );
			vertecies.push( vertecies[0], vertecies[1], vertecies[2] );
			lineVectors.push( new THREE.Vector3(vertecies[0], vertecies[1], vertecies[2]) );
			this.objectTape[objectIndex].pointData.push(lineVectors);
		}
		//create point clouds for each line
		objectIndex++;
		this.objectTape.push( new animationObject() );
		this.objectTape[objectIndex].objectID = this.groupName+this.objectIDIndex;
		for(partIndex=0; partIndex<this.pollyCount; partIndex++)
		{
			tempCurve = new THREE.CatmullRomCurve3( this.objectTape[0].pointData[partIndex] );
			vertecies = new Array();
			pointData = new Array();
			//motion directional
			this.generatedirectionalVectors();
			this.objectTape[objectIndex].extrude.push(this.directionalVectors[0]);
			tempPos = Math.random();
			for(vertIndex=0; vertIndex<this.pointCloudCount; vertIndex++)
			{
				pointData.push(tempPos+((1/this.pollyFitness)*vertIndex));
				vertecies.push( tempCurve.getPointAt( pointData[vertIndex]%1 ) );
			}
			this.objectTape[objectIndex].pointData.push( pointData );
			//Geometries
			this.objectTape[objectIndex].geometry.push(  new THREE.BufferGeometry().setFromPoints(  vertecies ) );
			this.objectTape[objectIndex].geometry[partIndex].applyMatrix4( new THREE.Matrix4().makeTranslation( 0, -lowPoint[1], 0 ) );
			//Material
			this.objectTape[objectIndex].materials.push( new THREE.PointsMaterial( {color: 0xffffff, map: this.sprite, transparent: true} ) );
			this.objectTape[objectIndex].materials[partIndex].transparent = true;
			this.objectTape[objectIndex].materials[partIndex].opacity = this.defaultOpacity;
			//clouds particles size
			this.objectTape[objectIndex].materials[partIndex].size = 1;
			//colour
			this.setMaterialColour(this.objectTape[objectIndex].materials[partIndex], this.subColourIndex);
			//Object
			this.objectTape[objectIndex].objects.push( new THREE.Points(this.objectTape[objectIndex].geometry[partIndex], this.objectTape[objectIndex].materials[partIndex]) );
			//rotate around X axis
			this.objectTape[objectIndex].objects[partIndex].rotateX(this.angleToRadian( (360/this.pollyCount)*partIndex ) )
			if(this.bloomEnable==1)
			{
				this.objectTape[objectIndex].objects[partIndex].layers.enable( 1 );
			}
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
	setMaterialColour = function(materialObject, colourIndex)
	{
		this.colourObject.getColour( colourIndex%this.colourObject._bandWidth );
		materialObject.color.r = this.colourObject._currentColour[0]/255;
		materialObject.color.g = this.colourObject._currentColour[1]/255;
		materialObject.color.b = this.colourObject._currentColour[2]/255;
	}
}
export default threePearPolly;