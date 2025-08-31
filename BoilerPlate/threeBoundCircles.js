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

class threeBoundCircles
{	
	constructor()
	{
		//Main object stores
		this.objectTape = new Array();
		this.globalGroupArray = new Array();
		this.globalObjectGroup = new THREE.Object3D();
		this.groupName = "BC_";
		this.objectIDIndex = 0;
		this.genObject = new animationObject();
		
		//Global Three Objects form main System
		this.scene;
		
		//Main properties
		this.origin = [0,0,0];
		this.orbitRadius = 200;
		this.circleCount = 4;
		this.circleRadius = 50;
		this.beamLength = 10;
		this.pollyFitness = 64;
		this.lineThickness = 2;
		this.pulseLineThickness = 4;
		this.laserLineThickness = 1;
		this.startAngle = 0;
		this.speedMod = Math.random()+0.01;
		this.lfoSeed = 0;
		this.opacity = 1;
		this.bloomEnable = 1;
		this.rotations = [0,0,0];
		this.rotationIncrements = [Math.random()+0.00001, Math.random()+0.00001, Math.random()+0.00001]
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
		this.lfo.addWithTimeCode("cState", [ 100 ], [100], 0, this.lfoSeed);
	}
	animate = function(colourControls, controlData, rotationalIncrements=[0,0,0])
	{
		//controlData[0]  object scale
		//controlData[1]  width scale
		//controlData[2]  height scale
		//controlData[3]  depth scale
		//controlData[4]  vertex rotation scaler
		//controlData[5]  line width scale
		//controlData[6]  bound circles rotation speed
		//controlData[7]  bounding line widths
		//controlData[8]  inner circle phase
		//controlData[9]  inner circle lfo speed
		//controlData[10]  laser line thicknes
		//controlData[11]  laser line length scale
		//controlData[12]  laser line speed


		if(this.setUpStatus==0){return;}	
		var objectIndex=0, partIndex=0, vertIndex=0;
		var pointPos, currentAngle;
		var innerCircleRadius = 0, innerCircleTimeCode = this.lfo.getTimeCode("cState");
		var currentTimeCode = innerCircleTimeCode;
		var laserLength = 0, laserSpeed = 0;
		var vertecies = new Array(), tempCurve, lineVertecies, vertArray;
		
		this.startAngle += this.speedMod*controlData[6];
		
		for(objectIndex=0; objectIndex<2; objectIndex++)
		{
			//width of bound objects line
			this.objectTape[objectIndex].materials[partIndex].linewidth = this.lineThickness*controlData[7];
			//colour of bound objects line
			this.colourObject.getColour( this.subColourIndex%this.colourObject._bandWidth );
			this.objectTape[objectIndex].materials[partIndex].color.r = this.colourObject._currentColour[0]/255;
			this.objectTape[objectIndex].materials[partIndex].color.g = this.colourObject._currentColour[1]/255;
			this.objectTape[objectIndex].materials[partIndex].color.b = this.colourObject._currentColour[2]/255;
			this.subColourIndex+=colourControls[1];
		}		
		for(partIndex=0; partIndex<this.circleCount; partIndex++)
		{
			currentAngle = ((360/this.circleCount)*partIndex)+this.startAngle;
			pointPos = this.pixelMap.getElipticalPointsRaw(0, 0, this.orbitRadius, this.orbitRadius, currentAngle);
			this.objectTape[objectIndex].objects[partIndex].position.set(pointPos[0], pointPos[1], 0);
			//rotation
			this.objectTape[objectIndex].objects[partIndex].setRotationFromEuler( new THREE.Euler( 0, 0, 0, 'XYZ' ));
			this.objectTape[objectIndex].objects[partIndex].rotateX( this.angleToRadian(90) );
			this.objectTape[objectIndex].objects[partIndex].rotateY( this.angleToRadian( currentAngle%180 ) );
			//width of bound objects line
			this.objectTape[objectIndex].materials[partIndex].linewidth = this.lineThickness*controlData[5];
			//colour of bound objects line
			this.colourObject.getColour( this.subColourIndex%this.colourObject._bandWidth );
			this.objectTape[objectIndex].materials[partIndex].color.r = this.colourObject._currentColour[0]/255;
			this.objectTape[objectIndex].materials[partIndex].color.g = this.colourObject._currentColour[1]/255;
			this.objectTape[objectIndex].materials[partIndex].color.b = this.colourObject._currentColour[2]/255;
			this.subColourIndex+=colourControls[1];
		}
		objectIndex++;
		//inner pulsating circles based on cState LFO
		for(partIndex=0; partIndex<this.circleCount; partIndex++)
		{
			currentAngle = ((360/this.circleCount)*partIndex)+this.startAngle;
			pointPos = this.pixelMap.getElipticalPointsRaw(0, 0, this.orbitRadius, this.orbitRadius, currentAngle);
			this.objectTape[objectIndex].objects[partIndex].position.set(pointPos[0], pointPos[1], 0);
			//scale
			currentTimeCode += controlData[8];
			innerCircleRadius = this.lfo.read("cState", 0, currentTimeCode)/100;
			this.objectTape[objectIndex].objects[partIndex].scale.set(innerCircleRadius, innerCircleRadius, innerCircleRadius);
			//if scale is 0 trigger the laser beam for this object
			if(innerCircleRadius<0.1)
			{
				this.objectTape[objectIndex+1].pointData[partIndex] = 1;
			}
			//rotation
			this.objectTape[objectIndex].objects[partIndex].setRotationFromEuler( new THREE.Euler( 0, 0, 0, 'XYZ' ));
			this.objectTape[objectIndex].objects[partIndex].rotateX( this.angleToRadian(90) );
			this.objectTape[objectIndex].objects[partIndex].rotateY( this.angleToRadian( currentAngle%180 ) );
			//width of bound objects line
			this.objectTape[objectIndex].materials[partIndex].linewidth = this.pulseLineThickness*controlData[5];
			//colour of bound objects line
			this.colourObject.getColour( this.subColourIndex%this.colourObject._bandWidth );
			this.objectTape[objectIndex].materials[partIndex].color.r = this.colourObject._currentColour[0]/255;
			this.objectTape[objectIndex].materials[partIndex].color.g = this.colourObject._currentColour[1]/255;
			this.objectTape[objectIndex].materials[partIndex].color.b = this.colourObject._currentColour[2]/255;
			this.subColourIndex+=colourControls[1];
		}
		objectIndex++;
		//LASER BEAMS 
		for(partIndex=0; partIndex<this.circleCount; partIndex++)
		{
			laserLength = this.beamLength*controlData[11];
			laserSpeed = this.beamLength*controlData[12];
			if(this.objectTape[objectIndex].pointData[partIndex] == 1)
			{
				if(this.objectTape[objectIndex].extrude[partIndex]-laserSpeed>0)
				{
					this.objectTape[objectIndex].extrude[partIndex] -= laserSpeed;
					this.objectTape[objectIndex].materials[partIndex].opacity = this.objectTape[objectIndex].extrude[partIndex]/this.orbitRadius;
					this.objectTape[objectIndex].objects[partIndex].visible = true;
				}
				else
				{
					this.objectTape[objectIndex].extrude[partIndex] = this.orbitRadius-laserSpeed;
					this.objectTape[objectIndex].pointData[partIndex] = 0;
					this.objectTape[objectIndex].materials[partIndex].opacity = 0;
					this.objectTape[objectIndex].objects[partIndex].visible = false;
				}
			}
			vertecies = new Array();
			currentAngle = ((360/this.circleCount)*partIndex)+this.startAngle;
			pointPos = this.pixelMap.getElipticalPointsRaw(0, 0, this.objectTape[objectIndex].extrude[partIndex]+laserLength, this.objectTape[objectIndex].extrude[partIndex]+laserLength, currentAngle);
			vertecies.push( new THREE.Vector3(pointPos[0], pointPos[1], 0) );
			//end point
			pointPos = this.pixelMap.getElipticalPointsRaw(0, 0, this.objectTape[objectIndex].extrude[partIndex], this.objectTape[objectIndex].extrude[partIndex], currentAngle); 	
			vertecies.push( new THREE.Vector3(pointPos[0], pointPos[1], 0) );
			
			tempCurve = new THREE.CatmullRomCurve3( vertecies );
			lineVertecies = tempCurve.getPoints( 2 );
			vertArray = new Array();
			for(vertIndex=0; vertIndex<lineVertecies.length; vertIndex++)
			{
				vertArray.push(lineVertecies[vertIndex].x, lineVertecies[vertIndex].y, lineVertecies[vertIndex].z)
			}
			//Geometries
			this.objectTape[objectIndex].geometry[partIndex].setPositions( vertArray );
			//width of bound objects line
			this.objectTape[objectIndex].materials[partIndex].linewidth = this.laserLineThickness*controlData[10];
			//colour of bound objects line
			this.colourObject.getColour( this.subColourIndex%this.colourObject._bandWidth );
			this.objectTape[objectIndex].materials[partIndex].color.r = this.colourObject._currentColour[0]/255;
			this.objectTape[objectIndex].materials[partIndex].color.g = this.colourObject._currentColour[1]/255;
			this.objectTape[objectIndex].materials[partIndex].color.b = this.colourObject._currentColour[2]/255;
			this.subColourIndex+=colourControls[1];
		}
		
		//increment the lfo
		this.lfo.setTimeCode("cState", innerCircleTimeCode+controlData[9]);
		
		//global rotation		
		this.globalObjectGroup.rotateX( this.angleToRadian(rotationalIncrements[0]*this.rotationIncrements[0]) );
		this.globalObjectGroup.rotateY( this.angleToRadian(rotationalIncrements[1]*this.rotationIncrements[1]) );
		this.globalObjectGroup.rotateZ( this.angleToRadian(rotationalIncrements[2]*this.rotationIncrements[2]) );
		//scale
		this.globalObjectGroup.scale.set(controlData[0]*controlData[1], controlData[0]*controlData[2], controlData[0]*controlData[3]); 

		this.colourIndex += colourControls[0];
		this.subColourIndex = this.colourIndex;
	}
	insertObject = function()
	{
		var objectIndex=0, partIndex=0, vertIndex=0, boundingObject=0;
		var pointPos;
		var vertecies = new Array(), tempCurve, lineVertecies, vertArray;
		var localGroup = new THREE.Object3D();
		var innerCircleRadius = 0;
		
		this.subColourIndex = this.colourIndex;
		
		//-------------------------------create the lower orbit circle-------------------------------
		this.objectTape.push( new animationObject() );
		this.objectTape[objectIndex].objectID = this.groupName+this.objectIDIndex;
		vertecies = new Array();
		for(vertIndex=0; vertIndex<this.pollyFitness; vertIndex++)
		{
			pointPos = this.pixelMap.getElipticalPointsRaw(0, 0, this.orbitRadius, this.orbitRadius, (360/this.pollyFitness)*vertIndex);
			vertecies.push( new THREE.Vector3(pointPos[0], pointPos[1], -this.circleRadius) );
		}
		vertecies.push(vertecies[0]);		
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
			this.objectTape[objectIndex].objects[partIndex].layers.enable( 1 );
		}
		//add to local group
		localGroup.add( this.objectTape[objectIndex].objects[partIndex] );
		objectIndex++;
		
		//-------------------------------create the upper orbit circle-------------------------------
		this.objectTape.push( new animationObject() );
		this.objectTape[objectIndex].objectID = this.groupName+this.objectIDIndex;
		vertecies = new Array();
		for(vertIndex=0; vertIndex<this.pollyFitness; vertIndex++)
		{
			pointPos = this.pixelMap.getElipticalPointsRaw(0, 0, this.orbitRadius, this.orbitRadius, (360/this.pollyFitness)*vertIndex);
			vertecies.push( new THREE.Vector3(pointPos[0], pointPos[1], this.circleRadius) );
		}		
		vertecies.push(vertecies[0]);		
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
			this.objectTape[objectIndex].objects[partIndex].layers.enable( 1 );
		}
		//add to local group
		localGroup.add( this.objectTape[objectIndex].objects[partIndex] );
		objectIndex++;
		
		//increment colour index
		this.subColourIndex = this.colourIndex+100;
		//-------------------------------create the boudend circles-------------------------------
		for(boundingObject=0; boundingObject<this.circleCount; boundingObject++)
		{
			this.objectTape.push( new animationObject() );
			this.objectTape[objectIndex].objectID = this.groupName+this.objectIDIndex;
			vertecies = new Array();
			for(vertIndex=0; vertIndex<this.pollyFitness; vertIndex++)
			{
				pointPos = this.pixelMap.getElipticalPointsRaw(0, 0, this.circleRadius, this.circleRadius, (360/this.pollyFitness)*vertIndex);
				vertecies.push( new THREE.Vector3(pointPos[0], pointPos[1], 0) );
			}		
			vertecies.push(vertecies[0]);		
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
			//position
			pointPos = this.pixelMap.getElipticalPointsRaw(0, 0, this.orbitRadius, this.orbitRadius, (360/this.circleCount)*boundingObject);
			this.objectTape[objectIndex].objects[partIndex].position.set(pointPos[0], pointPos[1], 0);
			//rotation
			this.objectTape[objectIndex].objects[partIndex].rotateX( this.angleToRadian(90) );
			this.objectTape[objectIndex].objects[partIndex].rotateY( this.angleToRadian( ((360/this.circleCount)*boundingObject)%180 ) );
			if(this.bloomEnable==1)
			{
				this.objectTape[objectIndex].objects[partIndex].layers.enable( 1 );
			}
			//add to local group
			localGroup.add( this.objectTape[objectIndex].objects[partIndex] );
			partIndex++;
		}
		objectIndex++;
		partIndex=0;
		//-------------------------------create INNER boudend circles-------------------------------
		for(boundingObject=0; boundingObject<this.circleCount; boundingObject++)
		{
			this.objectTape.push( new animationObject() );
			this.objectTape[objectIndex].objectID = this.groupName+this.objectIDIndex;
			vertecies = new Array();
			for(vertIndex=0; vertIndex<this.pollyFitness; vertIndex++)
			{
				pointPos = this.pixelMap.getElipticalPointsRaw(0, 0, this.circleRadius, this.circleRadius, (360/this.pollyFitness)*vertIndex);
				vertecies.push( new THREE.Vector3(pointPos[0], pointPos[1], 0) );
			}		
			vertecies.push(vertecies[0]);		
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
			this.objectTape[objectIndex].materials.push( new LineMaterial( {color: 0xffffff, linewidth: this.pulseLineThickness, worldUnits: true, vertexColors: false, alphaToCoverage: false} ) );
			this.objectTape[objectIndex].materials[partIndex].transparent = true;
			this.objectTape[objectIndex].materials[partIndex].opacity = this.opacity;
			//colour
			this.colourObject.getColour( this.subColourIndex%this.colourObject._bandWidth );
			this.objectTape[objectIndex].materials[partIndex].color.r = this.colourObject._currentColour[0]/255;
			this.objectTape[objectIndex].materials[partIndex].color.g = this.colourObject._currentColour[1]/255;
			this.objectTape[objectIndex].materials[partIndex].color.b = this.colourObject._currentColour[2]/255;
			//Object
			this.objectTape[objectIndex].objects.push( new Line2(this.objectTape[objectIndex].geometry[partIndex], this.objectTape[objectIndex].materials[partIndex]) );
			//position
			pointPos = this.pixelMap.getElipticalPointsRaw(0, 0, this.orbitRadius, this.orbitRadius, (360/this.circleCount)*boundingObject);
			this.objectTape[objectIndex].objects[partIndex].position.set(pointPos[0], pointPos[1], 0);
			//scale
			innerCircleRadius = this.lfo.read("cState", 0, (100/this.circleCount)*boundingObject)/100;
			this.objectTape[objectIndex].objects[partIndex].scale.set(innerCircleRadius, innerCircleRadius, innerCircleRadius);
			//rotation
			this.objectTape[objectIndex].objects[partIndex].rotateX( this.angleToRadian(90) );
			this.objectTape[objectIndex].objects[partIndex].rotateY( this.angleToRadian( ((360/this.circleCount)*boundingObject)%180 ) );
			if(this.bloomEnable==1)
			{
				this.objectTape[objectIndex].objects[partIndex].layers.enable( 1 );
			}
			//add to local group
			localGroup.add( this.objectTape[objectIndex].objects[partIndex] );
			partIndex++;
		}
		objectIndex++;
		partIndex=0;
		//-------------------------------create laser beams -------------------------------
		for(boundingObject=0; boundingObject<this.circleCount; boundingObject++)
		{
			this.objectTape.push( new animationObject() );
			this.objectTape[objectIndex].objectID = this.groupName+this.objectIDIndex;
			this.objectTape[objectIndex].extrude.push( this.orbitRadius-this.beamLength );
			this.objectTape[objectIndex].pointData.push(0);
			//laser beam
			vertecies = new Array();
			//start point
			pointPos = this.pixelMap.getElipticalPointsRaw(0, 0, this.orbitRadius, this.orbitRadius, (360/this.circleCount)*boundingObject);
			vertecies.push( new THREE.Vector3(pointPos[0], pointPos[1], 0) );
			//end point
			pointPos = this.pixelMap.getElipticalPointsRaw(0, 0, this.orbitRadius-this.objectTape[objectIndex].extrude[partIndex], this.orbitRadius-this.objectTape[objectIndex].extrude[partIndex], (360/this.circleCount)*boundingObject); 	
			vertecies.push( new THREE.Vector3(pointPos[0], pointPos[1], 0) );
			
			tempCurve = new THREE.CatmullRomCurve3( vertecies );
			lineVertecies = tempCurve.getPoints( 2 );
			vertArray = new Array();
			for(vertIndex=0; vertIndex<lineVertecies.length; vertIndex++)
			{
				vertArray.push(lineVertecies[vertIndex].x, lineVertecies[vertIndex].y, lineVertecies[vertIndex].z)
			}
			//Geometries
			this.objectTape[objectIndex].geometry.push(  new LineGeometry() );
			this.objectTape[objectIndex].geometry[partIndex].setPositions( vertArray );
			//Material
			this.objectTape[objectIndex].materials.push( new LineMaterial( {color: 0xffffff, linewidth: this.laserLineThickness, worldUnits: true, vertexColors: false, alphaToCoverage: false} ) );
			this.objectTape[objectIndex].materials[partIndex].transparent = true;
			this.objectTape[objectIndex].materials[partIndex].opacity = this.opacity;
			//colour
			this.colourObject.getColour( this.subColourIndex%this.colourObject._bandWidth );
			this.objectTape[objectIndex].materials[partIndex].color.r = this.colourObject._currentColour[0]/255;
			this.objectTape[objectIndex].materials[partIndex].color.g = this.colourObject._currentColour[1]/255;
			this.objectTape[objectIndex].materials[partIndex].color.b = this.colourObject._currentColour[2]/255;
			//Object
			this.objectTape[objectIndex].objects.push( new Line2(this.objectTape[objectIndex].geometry[partIndex], this.objectTape[objectIndex].materials[partIndex]) );
			this.objectTape[objectIndex].objects[partIndex].visible = false;
			
			if(this.bloomEnable==1)
			{
				this.objectTape[objectIndex].objects[partIndex].layers.enable( 1 );
			}
			//add to local group
			localGroup.add( this.objectTape[objectIndex].objects[partIndex] );
			partIndex++;
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
export default threeBoundCircles;