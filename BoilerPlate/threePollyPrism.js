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

class threePollyPrism
{	
	constructor()
	{
		//Main object stores
		this.objectTape = new Array();
		this.globalGroupArray = new Array();
		this.globalObjectGroup = new THREE.Object3D();
		this.groupName = "PP_";
		this.objectIDIndex = 0;
		this.genObject = new animationObject();
		
		//Global Three Objects form main System
		this.scene;
		
		//Main properties
		this.origin = [0,0,0];
		this.dimensions = [100,100,100];
		this.pointCount = 6;
		this.lineThickness = 1;
		this.pollyFitness = 128;
		this.lfoSeed = 0;
		this.bloomEnable = 0;
		this.defaultOpacity = 1;
		this.defaultFaceOpacity = 0.2;
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
		this.rotationalSpeed = [0,0,0];
		
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
		this.lfo.addWithTimeCode("lineWidth", [ 100 ], [100], 0, this.lfoSeed);
	}
	animate = function(colourControls, controlData, rotationalIncrements=[0,0,0])
	{
		//controlData[0]  object scale
		//controlData[1]  width scale
		//controlData[2]  height scale
		//controlData[3]  depth scale
		//controlData[4]  line width scale
		//controlData[5]  line width lfo speed

		if(this.setUpStatus==0){return;}
		
		var objectIndex=0, partIndex=0;
		var LFORead = 0;
		//var lfoStartIndex = this.lfo.getTimeCode("lineWidth");
		//var lfoIndex = lfoStartIndex;
		
		//update line widths based on LFO
		
		LFORead = this.lfo.read("lineWidth", controlData[5]+0.00001, 0)/100;
		for(partIndex=0; partIndex<this.objectTape[objectIndex].materials.length; partIndex++)
		{
			//this.objectTape[objectIndex].materials[partIndex].linewidth = ((this.lineThickness*controlData[4])*(this.lfo.read("lineWidth", controlData[5]+0.00001, 0)/100));
			this.objectTape[objectIndex].materials[partIndex].linewidth = this.lineThickness*controlData[4];
			this.objectTape[objectIndex].materials[partIndex].opacity = LFORead
			//colour
			this.setMaterialColour(this.objectTape[objectIndex].materials[partIndex], this.subColourIndex);
		}
		//face colours
		objectIndex++;
		for(partIndex=0; partIndex<this.objectTape[objectIndex].materials.length; partIndex++)
		{
			//colour
			this.setMaterialColour(this.objectTape[objectIndex].materials[partIndex], this.subColourIndex);
			this.objectTape[objectIndex].materials[partIndex].opacity = LFORead*this.defaultFaceOpacity;
			this.subColourIndex+=colourControls[1];
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
		var objectIndex=0, partIndex=0, vertIndex=0, copyIndex=0, faceIndex=0;
		var pointPos = this.pixelMap.getElipticalPointsRaw(0, 0, this.dimensions[2], this.dimensions[2], 180);
		var zOffset = pointPos[1];
		var frontVertecies, rearVertecies, midBodyVertecies, topVertecies, bottomVertecies;
		var faceVertecies = new Array(), fVerts;
		var localGroup = new THREE.Object3D();
		var tempPoint;
		
		//create main polly shape
		this.objectTape.push( new animationObject() );
		this.objectTape[objectIndex].objectID = this.groupName+this.objectIDIndex;
		frontVertecies = new Array();
		rearVertecies = new Array();
		for(vertIndex=0; vertIndex<this.pointCount; vertIndex++)
		{
			pointPos = this.pixelMap.getElipticalPointsRaw(0, 0, this.dimensions[0], this.dimensions[1], (360/this.pointCount)*vertIndex);
			frontVertecies.push( pointPos[0], pointPos[1], zOffset );
			pointPos = this.pixelMap.getElipticalPointsRaw(0, 0, this.dimensions[0], this.dimensions[1], ((360/this.pointCount)*vertIndex)+((360/this.pointCount)/2));			
			rearVertecies.push( pointPos[0], pointPos[1], -zOffset );
		}
		frontVertecies.push(frontVertecies[0], frontVertecies[1], frontVertecies[2]);
		rearVertecies.push(rearVertecies[0], rearVertecies[1], rearVertecies[2]);
		
		//---------------------		create front face vertecies	---------------------
		for(vertIndex=0; vertIndex<frontVertecies.length; vertIndex+=3)
		{
			fVerts = new Array();
			//1st point from the flat plane
			fVerts.push(frontVertecies[vertIndex], frontVertecies[vertIndex+1], frontVertecies[vertIndex+2]);
			//centre point
			fVerts.push(0,0,zOffset*2);
			//next point
			if(vertIndex+3<frontVertecies.length)
			{
				fVerts.push(frontVertecies[vertIndex+3], frontVertecies[vertIndex+4], frontVertecies[vertIndex+5]);
			}
			else
			{
				fVerts.push(frontVertecies[0], frontVertecies[1], frontVertecies[2]);
			}
			//back to start
			fVerts.push(frontVertecies[vertIndex], frontVertecies[vertIndex+1], frontVertecies[vertIndex+2]);
			faceVertecies.push(new Float32Array(fVerts));
		}
		//---------------------		create rear face vertecies	---------------------
		for(vertIndex=0; vertIndex<rearVertecies.length; vertIndex+=3)
		{
			fVerts = new Array();
			//1st point from the flat plane
			fVerts.push(rearVertecies[vertIndex], rearVertecies[vertIndex+1], rearVertecies[vertIndex+2]);
			//centre point
			fVerts.push(0,0,-zOffset*2);
			//next point
			if(vertIndex+3<rearVertecies.length)
			{
				fVerts.push(rearVertecies[vertIndex+3], rearVertecies[vertIndex+4], rearVertecies[vertIndex+5]);
			}
			else
			{
				fVerts.push(rearVertecies[0], rearVertecies[1], rearVertecies[2]);
			}
			//back to start
			fVerts.push(rearVertecies[vertIndex], rearVertecies[vertIndex+1], rearVertecies[vertIndex+2]);
			faceVertecies.push(new Float32Array(fVerts));
		}
		
		//-----------------------------------------------------------------------
		//Geometries
		this.objectTape[objectIndex].geometry.push(  new LineGeometry() );
		this.objectTape[objectIndex].geometry[partIndex].setPositions( frontVertecies );
		this.objectTape[objectIndex].geometry.push(  new LineGeometry() );
		this.objectTape[objectIndex].geometry[partIndex+1].setPositions( rearVertecies );
		//Material
		this.objectTape[objectIndex].materials.push( new LineMaterial( {color: 0xffffff, linewidth: this.lineThickness, worldUnits: true, vertexColors: false, alphaToCoverage: false} ) );
		this.objectTape[objectIndex].materials[partIndex].transparent = true;
		this.objectTape[objectIndex].materials[partIndex].opacity = this.defaultOpacity;
		this.objectTape[objectIndex].materials.push( new LineMaterial( {color: 0xffffff, linewidth: this.lineThickness, worldUnits: true, vertexColors: false, alphaToCoverage: false} ) );
		this.objectTape[objectIndex].materials[partIndex+1].transparent = true;
		this.objectTape[objectIndex].materials[partIndex+1].opacity = this.defaultOpacity;
		//colour
		this.setMaterialColour(this.objectTape[objectIndex].materials[partIndex], this.subColourIndex);
		this.setMaterialColour(this.objectTape[objectIndex].materials[partIndex+1], this.subColourIndex);
		//Object
		this.objectTape[objectIndex].objects.push( new Line2(this.objectTape[objectIndex].geometry[partIndex], this.objectTape[objectIndex].materials[partIndex]) );
		this.objectTape[objectIndex].objects.push( new Line2(this.objectTape[objectIndex].geometry[partIndex+1], this.objectTape[objectIndex].materials[partIndex+1]) );
		if(this.bloomEnable==1)
		{
			this.objectTape[objectIndex].objects[partIndex].layers.enable( 1 );
			this.objectTape[objectIndex].objects[partIndex+1].layers.enable( 1 );
		}
		//add to local group
		localGroup.add( this.objectTape[objectIndex].objects[partIndex] );
		localGroup.add( this.objectTape[objectIndex].objects[partIndex+1] );
		
		//create the mid body triangles
		partIndex+=2;
		midBodyVertecies = new Array();
		for(vertIndex=0; vertIndex<this.pointCount*2; vertIndex++)
		{
			if(vertIndex%2==0)
			{
				midBodyVertecies.push(frontVertecies[copyIndex], frontVertecies[copyIndex+1], frontVertecies[copyIndex+2]);
			}
			else if(vertIndex%2==1)
			{
				midBodyVertecies.push(rearVertecies[copyIndex], rearVertecies[copyIndex+1], rearVertecies[copyIndex+2]);
				copyIndex+=3;
			}
		}
		midBodyVertecies.push(midBodyVertecies[0], midBodyVertecies[1], midBodyVertecies[2]);
		//---------------------		create centre face vertecies	---------------------
		for(vertIndex=0; vertIndex<midBodyVertecies.length-3; vertIndex+=3)
		{
			fVerts = new Array();
			
			if((vertIndex/3)==(this.pointCount*2)-1)
			{
				//1st point from the flat plane
				fVerts.push(midBodyVertecies[vertIndex], midBodyVertecies[vertIndex+1], midBodyVertecies[vertIndex+2]);
				//2nd point
				fVerts.push(midBodyVertecies[0], midBodyVertecies[1], midBodyVertecies[2]);
				//3rd point
				fVerts.push(midBodyVertecies[3], midBodyVertecies[4], midBodyVertecies[5]);
				//back to start
				fVerts.push(midBodyVertecies[vertIndex], midBodyVertecies[vertIndex+1], midBodyVertecies[vertIndex+2]);
			}
			else
			{
				//1st point from the flat plane
				fVerts.push(midBodyVertecies[vertIndex], midBodyVertecies[vertIndex+1], midBodyVertecies[vertIndex+2]);
				//2nd point
				fVerts.push(midBodyVertecies[vertIndex+3], midBodyVertecies[vertIndex+4], midBodyVertecies[vertIndex+5]);
				//3rd point
				fVerts.push(midBodyVertecies[vertIndex+6], midBodyVertecies[vertIndex+7], midBodyVertecies[vertIndex+8]);
				//back to start
				fVerts.push(midBodyVertecies[vertIndex], midBodyVertecies[vertIndex+1], midBodyVertecies[vertIndex+2]);
			}
			faceVertecies.push(new Float32Array(fVerts));
		}
		//-----------------------------------------------------------------------
		//Geometries
		this.objectTape[objectIndex].geometry.push(  new LineGeometry() );
		this.objectTape[objectIndex].geometry[partIndex].setPositions( midBodyVertecies );
		//Material
		this.objectTape[objectIndex].materials.push( new LineMaterial( {color: 0xffffff, linewidth: this.lineThickness, worldUnits: true, vertexColors: false, alphaToCoverage: false} ) );
		this.objectTape[objectIndex].materials[partIndex].transparent = true;
		this.objectTape[objectIndex].materials[partIndex].opacity = this.defaultOpacity;
		//colour
		this.setMaterialColour(this.objectTape[objectIndex].materials[partIndex], this.subColourIndex);
		//Object
		this.objectTape[objectIndex].objects.push( new Line2(this.objectTape[objectIndex].geometry[partIndex], this.objectTape[objectIndex].materials[partIndex]) );
		if(this.bloomEnable==1)
		{
			this.objectTape[objectIndex].objects[partIndex].layers.enable( 1 );
		}
		//add to local group
		localGroup.add( this.objectTape[objectIndex].objects[partIndex] );
		
		//create the top and bottom points
		partIndex++;
		topVertecies = new Array();
		bottomVertecies = new Array();
		for(vertIndex=0; vertIndex<this.pointCount; vertIndex++)
		{
			pointPos = this.pixelMap.getElipticalPointsRaw(0, 0, this.dimensions[0], this.dimensions[1], (360/this.pointCount)*vertIndex);
			topVertecies.push( pointPos[0], pointPos[1], zOffset );
			topVertecies.push( 0, 0, zOffset*2 );
			pointPos = this.pixelMap.getElipticalPointsRaw(0, 0, this.dimensions[0], this.dimensions[1], ((360/this.pointCount)*vertIndex)+36);			
			bottomVertecies.push( pointPos[0], pointPos[1], -zOffset );
			bottomVertecies.push( 0, 0, -zOffset*2 );
		}
		//Geometries
		this.objectTape[objectIndex].geometry.push(  new LineGeometry() );
		this.objectTape[objectIndex].geometry[partIndex].setPositions( topVertecies );
		this.objectTape[objectIndex].geometry.push(  new LineGeometry() );
		this.objectTape[objectIndex].geometry[partIndex+1].setPositions( bottomVertecies );
		//Material
		this.objectTape[objectIndex].materials.push( new LineMaterial( {color: 0xffffff, linewidth: this.lineThickness, worldUnits: true, vertexColors: false, alphaToCoverage: false} ) );
		this.objectTape[objectIndex].materials[partIndex].transparent = true;
		this.objectTape[objectIndex].materials[partIndex].opacity = this.defaultOpacity;
		
		this.objectTape[objectIndex].materials.push( new LineMaterial( {color: 0xffffff, linewidth: this.lineThickness, worldUnits: true, vertexColors: false, alphaToCoverage: false} ) );
		this.objectTape[objectIndex].materials[partIndex+1].transparent = true;
		this.objectTape[objectIndex].materials[partIndex+1].opacity = this.defaultOpacity;
		//colour
		this.setMaterialColour(this.objectTape[objectIndex].materials[partIndex], this.subColourIndex);
		this.setMaterialColour(this.objectTape[objectIndex].materials[partIndex+1], this.subColourIndex);
		//Object
		this.objectTape[objectIndex].objects.push( new Line2(this.objectTape[objectIndex].geometry[partIndex], this.objectTape[objectIndex].materials[partIndex]) );
		this.objectTape[objectIndex].objects.push( new Line2(this.objectTape[objectIndex].geometry[partIndex+1], this.objectTape[objectIndex].materials[partIndex+1]) );
		if(this.bloomEnable==1)
		{
			this.objectTape[objectIndex].objects[partIndex].layers.enable( 1 );
			this.objectTape[objectIndex].objects[partIndex+1].layers.enable( 1 );
		}
		//add to local group
		localGroup.add( this.objectTape[objectIndex].objects[partIndex] );
		localGroup.add( this.objectTape[objectIndex].objects[partIndex+1] );
		
		//create faces
		objectIndex++;
		partIndex=0;
		this.objectTape.push( new animationObject() );
		this.objectTape[objectIndex].objectID = this.groupName+this.objectIDIndex;
		for(partIndex=0; partIndex<faceVertecies.length; partIndex++)
		{
			//Geometries
			this.objectTape[objectIndex].geometry.push(  new THREE.BufferGeometry() );
			this.objectTape[objectIndex].geometry[partIndex].setAttribute( 'position', new THREE.BufferAttribute( faceVertecies[partIndex], 3 ) );
			//Material
			this.objectTape[objectIndex].materials.push( new THREE.MeshBasicMaterial( { color: 0x000000, side: THREE.DoubleSide } ) );
			this.objectTape[objectIndex].materials[partIndex].transparent = true;
			this.objectTape[objectIndex].materials[partIndex].opacity = this.defaultFaceOpacity;
			//colour
			this.setMaterialColour(this.objectTape[objectIndex].materials[partIndex], this.subColourIndex);
			//Object
			this.objectTape[objectIndex].objects.push( new THREE.Mesh( this.objectTape[objectIndex].geometry[partIndex], this.objectTape[objectIndex].materials[partIndex] ) );
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
export default threePollyPrism;