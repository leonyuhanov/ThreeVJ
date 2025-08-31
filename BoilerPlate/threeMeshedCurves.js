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

class threeMeshedCurves
{	
	constructor()
	{
		//Main object stores
		this.objectTape = new Array();
		this.globalGroupArray = new Array();
		this.globalObjectGroup = new THREE.Object3D();
		this.groupName = "MC_";
		this.objectIDIndex = 0;
		this.genObject = new animationObject();
		
		//Global Three Objects form main System
		this.scene;
		
		//Main properties
		this.origin = [0,0,0];
		this.meshLength = 200;
		this.radius = 200;
		this.radiusWobble = 50;
		this.vertecies = 8;
		this.curves = 2;
		this.shadowOpacity = 0.05;
		this.vertexPoints  = new Array();
		this.pollyFitness = 180;
		this.lineThickness = 2;
		this.lfoSeed = 0;
		this.opacity = 1;
		this.bloomEnable = 1;
		this.meshBloomEnable = 0;
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
		var vertexCounter = 0, curveCounter=0;
		var meshLocationIncrement = this.meshLength/this.curves, zStart = -(this.meshLength/2);
		var vector=1, wobble=0;
		var tempVertexArray;
		this.scene = scene;
		this.colourIndex = colourIndex;
		
		for(curveCounter=0; curveCounter<this.curves; curveCounter++)
		{
			tempVertexArray = new Array();
			//set up spline points
			for(vertexCounter=0; vertexCounter<this.vertecies; vertexCounter++)
			{
				this.generatedirectionalVectors();
				vector = this.directionalVectors[0];
				wobble = Math.random();
				tempVertexArray.push( new curvePoint(this.radius+(vector*(wobble*this.radiusWobble)),(360/this.vertecies)*vertexCounter,0,360) );
				tempVertexArray[vertexCounter].vector = vector;
				tempVertexArray[vertexCounter].wobble = wobble;
				tempVertexArray[vertexCounter].position[2] = zStart+(meshLocationIncrement*curveCounter);
			}
			//complete path back to start
			tempVertexArray.push( tempVertexArray[0] );
			this.vertexPoints.push( tempVertexArray );
		}
		
		//radius lfo
		this.lfo.addWithTimeCode("radialLFO", [ 100 ], [20], 0, this.lfoSeed);

	}
	animate = function(colourControls, controlData, rotationalIncrements=[0,0,0])
	{
		//controlData[0]  object scale
		//controlData[1]  width scale
		//controlData[2]  height scale
		//controlData[3]  depth scale
		//controlData[4]  vertex rotation scaler
		//controlData[5]  line width scale
		//controlData[6]  radial LFO Phase
		//controlData[7]  radial LFO Speed
		//controlData[8]  radius wobble scale

		if(this.setUpStatus==0){return;}	
		
		var objectIndex=0, partIndex=0, vertIndex=0, pointIndex=0, subVertIndex=0, curveIndex=0;
		var vertecies = new Array(), shadowVertecies = new Array();
		var tempCurve, lineVertecies, vertArray;
		var radialLFOIndex = this.lfo.getTimeCode("radialLFO");
		var currentRadialLFOIndex = radialLFOIndex;
		var currentRadius, shadowRadius;
		
		//radiusWobble
		for(curveIndex=0; curveIndex<this.vertexPoints.length; curveIndex++)
		{
			for(vertIndex=0; vertIndex<this.vertexPoints[curveIndex].length; vertIndex++)
			{
				this.vertexPoints[curveIndex][vertIndex].setRadius( this.radius+(this.vertexPoints[curveIndex][vertIndex].vector*this.radiusWobble*this.vertexPoints[curveIndex][vertIndex].wobble*controlData[8]) );
				this.vertexPoints[curveIndex][vertIndex].initRadius = this.vertexPoints[curveIndex][vertIndex].radius;
			}
		}
		
		for(objectIndex=0; objectIndex<this.curves; objectIndex++)
		{
			vertecies = new Array();
			for(vertIndex=0; vertIndex<this.vertexPoints[objectIndex].length; vertIndex++)
			{
				currentRadialLFOIndex += controlData[6];
				currentRadius = (this.lfo.read("radialLFO", 0, currentRadialLFOIndex)/100)*(this.radiusWobble);
				this.vertexPoints[objectIndex][vertIndex].setRadius(this.vertexPoints[objectIndex][vertIndex].initRadius+currentRadius);
				if(vertIndex+1<this.vertexPoints[objectIndex].length)
				{
					vertecies.push( new THREE.Vector3(this.vertexPoints[objectIndex][vertIndex].position[0], this.vertexPoints[objectIndex][vertIndex].position[1], this.vertexPoints[objectIndex][vertIndex].position[2]) );
				}
				else
				{
					vertecies.push( vertecies[0] );
				}
			}
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
		this.lfo.setTimeCode("radialLFO", radialLFOIndex+controlData[7]);
		//update mesh
		for(pointIndex=0; pointIndex<this.vertexPoints[0].length; pointIndex++)
		{
			//create a curve between the pointIndex points of each curve
			vertecies = new Array();
			for(subVertIndex=0; subVertIndex<this.curves; subVertIndex++)
			{
				vertecies.push( new THREE.Vector3(this.vertexPoints[subVertIndex][pointIndex].position[0], this.vertexPoints[subVertIndex][pointIndex].position[1], this.vertexPoints[subVertIndex][pointIndex].position[2]) );
			}
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
			this.subColourIndex += colourControls[1];
			objectIndex++;
		}
		
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
		var objectIndex=0, partIndex=0, vertIndex=0, subVertIndex=0, pointIndex=0;
		var vertecies = new Array(), tempCurve, lineVertecies, vertArray;
		var localGroup = new THREE.Object3D();
		
		this.subColourIndex = this.colourIndex;
		for(objectIndex=0; objectIndex<this.curves; objectIndex++)
		{
			//create a curve
			this.objectTape.push( new animationObject() );
			this.objectTape[objectIndex].objectID = this.groupName+this.objectIDIndex;
			vertecies = new Array();
			for(vertIndex=0; vertIndex<this.vertexPoints[objectIndex].length; vertIndex++)
			{
				vertecies.push( new THREE.Vector3(this.vertexPoints[objectIndex][vertIndex].position[0], this.vertexPoints[objectIndex][vertIndex].position[1], this.vertexPoints[objectIndex][vertIndex].position[2]) );
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
				this.objectTape[objectIndex].objects[partIndex].layers.enable( 1 );
			}
			//add to local group
			localGroup.add( this.objectTape[objectIndex].objects[partIndex] );
			this.subColourIndex += 10;
		}
		//set up meshes between each curve point
		for(pointIndex=0; pointIndex<this.vertexPoints[0].length; pointIndex++)
		{
			//create a curve between the pointIndex points of each curve
			this.objectTape.push( new animationObject() );
			this.objectTape[objectIndex].objectID = this.groupName+this.objectIDIndex;
			vertecies = new Array();
			for(subVertIndex=0; subVertIndex<this.curves; subVertIndex++)
			{
				vertecies.push( new THREE.Vector3(this.vertexPoints[subVertIndex][pointIndex].position[0], this.vertexPoints[subVertIndex][pointIndex].position[1], this.vertexPoints[subVertIndex][pointIndex].position[2]) );
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
			if(this.meshBloomEnable==1)
			{
				this.objectTape[objectIndex].objects[partIndex].layers.enable( 1 );
			}
			//add to local group
			localGroup.add( this.objectTape[objectIndex].objects[partIndex] );
			this.subColourIndex += 10;
			objectIndex++;
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
export default threeMeshedCurves;