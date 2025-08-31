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

class threeLaserLightning
{	
	constructor()
	{
		//Main object stores
		this.objectTape = new Array();
		this.globalGroupArray = new Array();
		this.globalObjectGroup = new THREE.Object3D();
		this.groupName = "LL_";
		this.objectIDIndex = 0;
		this.genObject = new animationObject();
		
		//Global Three Objects form main System
		this.scene;
		
		//Main properties
		this.origin = [0,0,0];
		this.radius = 50;
		this.depthRange = 100;
		this.incrementBy = 50;
		this.pollyCount = 2;
		this.laserCount = 2;
		this.laserRange = 20;
		this.laserLength = 5;
		this.orbitLaserLength = 5;
		this.laserData = new Array();
		this.pollyFitness = 64;
		this.maxPollyFitness = 0;
		this.lineThickness = 1;
		this.laserLineThickness = 2;
		this.lfoSeed = 0;
		this.radialOpacity = 1;
		this.laserGuideLineopacity = 1;
		this.bloomEnable = 0;
		this.laserBloomEnable = 1;
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
		this.lfo.addWithTimeCode("zDepth", [ 100 ], [100], 0, this.lfoSeed);
		this.maxPollyFitness = this.pollyFitness*2;
	}
	animate = function(colourControls, controlData, rotationalIncrements=[0,0,0])
	{
		//radius array, angle array, currentIndex, currentGroupIndex, laserSpeed, lineVertecies
		
		//controlData[0]  object scale
		//controlData[1]  width scale
		//controlData[2]  height scale
		//controlData[3]  depth scale
		//controlData[4]  line width scale
		//controlData[5]  laser speed scale
		//controlData[6]  laser length scale
		//controlData[7]  depth LFO Phase
		//controlData[8]  depth LFO Speed
		//controlData[9]  orbit laser speed scale
		//controlData[10]  orbit laser length scale
		//controlData[11]  orbit line width scale

		if(this.setUpStatus==0){return;}
		
		var objectIndex=0, partIndex=0, vertIndex=0, groupIndex=0, nextAngle=0;
		var vertecies, pointPos, tempCurve, lineVertecies, vertArray;
		var laserSpeed = 0, laserLength = Math.round(this.laserLength*controlData[6]), currentGroup = 0, orbitLaserLength = Math.round(this.orbitLaserLength*controlData[10]);
		var depthLFOStartIndex = this.lfo.getTimeCode("zDepth"), depthLFOCurrentIndex=0, currentDepth=0, startPoint=0;
		depthLFOCurrentIndex = depthLFOStartIndex;
		
		if(laserLength<=0)
		{
			laserLength = 1;
		}
		if(orbitLaserLength<=0)
		{
			orbitLaserLength = 1;
		}
		
		//outer object depth via lfo
		for(partIndex=0; partIndex<this.pollyCount; partIndex++)
		{
			currentDepth = -(this.depthRange/2) + (this.depthRange*(this.lfo.read("zDepth", 0, depthLFOCurrentIndex)/100));
			depthLFOCurrentIndex += controlData[7];
			this.objectTape[objectIndex].extrude[partIndex] = currentDepth;
			//this.objectTape[objectIndex].objects[partIndex].position.z = currentDepth;
			//layer veretices this.objectTape[0].pointData[partIndex]
			tempCurve = new THREE.CatmullRomCurve3( this.objectTape[0].pointData[partIndex] );
			lineVertecies = tempCurve.getPoints( this.pollyFitness );
			//increment rotatio index with speed and laser length
			laserSpeed = Math.round(this.objectTape[objectIndex+3].rotations[partIndex][1]*controlData[9]);
			this.objectTape[objectIndex+3].rotations[partIndex][0] = this.objectTape[objectIndex+3].rotations[partIndex][0]+laserSpeed;
			vertArray = new Array();
			for(vertIndex=this.objectTape[objectIndex+3].rotations[partIndex][0]; vertIndex<this.objectTape[objectIndex+3].rotations[partIndex][0]+orbitLaserLength; vertIndex++)
			{
				vertArray.push(lineVertecies[vertIndex%this.pollyFitness].x, lineVertecies[vertIndex%this.pollyFitness].y, this.objectTape[objectIndex].extrude[partIndex]);
			}
			//Geometries
			this.objectTape[objectIndex+3].geometry[partIndex].dispose();
			this.objectTape[objectIndex+3].geometry[partIndex].setPositions( vertArray );			
			//Material
			this.objectTape[objectIndex+3].materials[partIndex].linewidth = this.laserLineThickness*controlData[11];;
			//colour
			this.colourObject.getColour( this.subColourIndex%this.colourObject._bandWidth );
			this.objectTape[objectIndex+3].materials[partIndex].color.r = this.colourObject._currentColour[0]/255;
			this.objectTape[objectIndex+3].materials[partIndex].color.g = this.colourObject._currentColour[1]/255;
			this.objectTape[objectIndex+3].materials[partIndex].color.b = this.colourObject._currentColour[2]/255;
			this.subColourIndex+=colourControls[1];
		}
		this.lfo.setTimeCode("zDepth", depthLFOStartIndex+controlData[8])
		
		//guide lines update based on the LFO
		objectIndex=1;
		for(partIndex=0; partIndex<this.laserCount; partIndex++)
		{
			//create starting point
			vertecies = new Array();
			for(groupIndex=0; groupIndex<this.pollyCount; groupIndex++)
			{
				pointPos = this.pixelMap.getElipticalPointsRaw(0, 0, this.laserData[partIndex][0][groupIndex], this.laserData[partIndex][0][groupIndex], this.laserData[partIndex][1][groupIndex]);
				//vertecies.push( new THREE.Vector3(pointPos[0], pointPos[1], this.objectTape[0].objects[groupIndex].position.z) );
				vertecies.push( new THREE.Vector3(pointPos[0], pointPos[1], this.objectTape[0].extrude[groupIndex]) );
			}
			this.laserData[partIndex][5] = vertecies;
			/*
			tempCurve = new THREE.CatmullRomCurve3( vertecies );
			lineVertecies = tempCurve.getPoints( this.pollyFitness );
			vertArray = new Array();
			for(vertIndex=0; vertIndex<lineVertecies.length; vertIndex++)
			{
				vertArray.push(lineVertecies[vertIndex].x, lineVertecies[vertIndex].y, lineVertecies[vertIndex].z)
			}
			//Geometries
			this.objectTape[objectIndex].geometry[partIndex].setPositions( vertArray );
			*/
		}
		
		//laser motion
		objectIndex=2;
		for(partIndex=0; partIndex<this.laserCount; partIndex++)
		{
			//increment the current laser index
			laserSpeed = Math.round(this.laserData[partIndex][4]*controlData[5]);
			if(this.laserData[partIndex][2]+laserSpeed+laserLength<this.maxPollyFitness)
			{
				//this.laserData[partIndex][2]+=laserSpeed;
				this.laserData[partIndex][2] = (this.laserData[partIndex][2]+laserSpeed)%this.maxPollyFitness;
			}
			else
			{
				//create new angles for this laser
				for(groupIndex=0; groupIndex<this.pollyCount; groupIndex++)
				{
					//radius array, angle array, currentIndex, currentGroupIndex, laserSpeed, lineVertecies
					//update current position
					this.laserData[partIndex][2]=0;
					//this.laserData[partIndex][2] = (this.laserData[partIndex][2]+laserSpeed)%this.pollyFitness
					//update
					this.laserData[partIndex][0][groupIndex] = (this.radius+(this.incrementBy*groupIndex));
					if(groupIndex==0)
					{
						//update 1st angle
						//nextAngle = (360/this.laserCount)*partIndex;		//Ordered start angle by its position
						nextAngle = Math.random()*360;
						this.laserData[partIndex][1][0] = nextAngle;
					}
					else
					{
						//update next angles
						this.generatedirectionalVectors();
						nextAngle = this.laserData[partIndex][1][0]+(this.directionalVectors[0]*(Math.random()*this.laserRange) );
						this.laserData[partIndex][1][groupIndex] = nextAngle;
					}
				}
				/*
				//delete the guide line
				this.objectTape[1].objects[partIndex].removeFromParent();
				//clean up geomtry
				this.objectTape[1].geometry[partIndex].dispose();
				//create new guide line
				*/
				vertecies = new Array();
				for(groupIndex=0; groupIndex<this.pollyCount; groupIndex++)
				{
					pointPos = this.pixelMap.getElipticalPointsRaw(0, 0, this.laserData[partIndex][0][groupIndex], this.laserData[partIndex][0][groupIndex], this.laserData[partIndex][1][groupIndex]);
					vertecies.push( new THREE.Vector3(pointPos[0], pointPos[1], this.objectTape[0].extrude[groupIndex]) );
				}
				this.laserData[partIndex][5] = vertecies;
				/*
				tempCurve = new THREE.CatmullRomCurve3( vertecies );
				lineVertecies = tempCurve.getPoints( this.pollyFitness );
				vertArray = new Array();
				for(vertIndex=0; vertIndex<lineVertecies.length; vertIndex++)
				{
					vertArray.push(lineVertecies[vertIndex].x, lineVertecies[vertIndex].y, lineVertecies[vertIndex].z)
				}
				//Geometries
				this.objectTape[1].geometry[partIndex] = new LineGeometry();
				this.objectTape[1].geometry[partIndex].setPositions( vertArray );
				this.objectTape[1].objects[partIndex] = new Line2(this.objectTape[1].geometry[partIndex], this.objectTape[1].materials[partIndex]);
				this.globalObjectGroup.add(this.objectTape[1].objects[partIndex]);
				*/
			}
			vertecies = this.laserData[partIndex][5];
			tempCurve = new THREE.CatmullRomCurve3( vertecies );
			lineVertecies = tempCurve.getPoints( this.maxPollyFitness );
			vertArray = new Array();
			for(vertIndex=this.laserData[partIndex][2]; vertIndex<this.laserData[partIndex][2]+laserLength; vertIndex++)
			{
				if(vertIndex>this.maxPollyFitness)
				{
					break;
				}
				vertArray.push(lineVertecies[vertIndex].x, lineVertecies[vertIndex].y, lineVertecies[vertIndex].z);
			}
			//Geometries
			this.objectTape[objectIndex].geometry[partIndex].dispose();
			this.objectTape[objectIndex].geometry[partIndex].setPositions( vertArray );
			//Material
			//width of bound objects line
			this.objectTape[objectIndex].materials[partIndex].linewidth = this.laserLineThickness*controlData[4];
			//colour
			this.colourObject.getColour( this.subColourIndex%this.colourObject._bandWidth );
			this.objectTape[objectIndex].materials[partIndex].color.r = this.colourObject._currentColour[0]/255;
			this.objectTape[objectIndex].materials[partIndex].color.g = this.colourObject._currentColour[1]/255;
			this.objectTape[objectIndex].materials[partIndex].color.b = this.colourObject._currentColour[2]/255;
			this.subColourIndex+=colourControls[1];
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
		var objectIndex=0, partIndex=0, vertIndex=0, groupCounter=0;
		var pointPos, nextAngle;
		var vertecies = new Array(), tempCurve, lineVertecies, vertArray;
		var localGroup = new THREE.Object3D();
		
		//set the sub colour incrementer
		this.subColourIndex = this.colourObject._bandWidth-100;
		
		//create the main group circles
		this.objectTape.push( new animationObject() );
		this.objectTape[objectIndex].objectID = this.groupName+this.objectIDIndex;
		for(partIndex=0; partIndex<this.pollyCount; partIndex++)
		{
			vertecies = new Array();
			for(vertIndex=0; vertIndex<this.pollyFitness; vertIndex++)
			{
				pointPos = this.pixelMap.getElipticalPointsRaw(0, 0, this.radius+(this.incrementBy*partIndex), this.radius+(this.incrementBy*partIndex), (360/this.pollyFitness)*vertIndex);
				vertecies.push( new THREE.Vector3(pointPos[0], pointPos[1], 0) );
			}
			vertecies.push(vertecies[0]);
			this.objectTape[objectIndex].pointData.push(vertecies);
			this.objectTape[objectIndex].extrude.push(0);//used to store z axis location
			/*
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
			this.objectTape[objectIndex].materials[partIndex].opacity = this.radialOpacity;
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
			*/
		}
		objectIndex++;
		
		//set up the lasers start & end angles
		for(partIndex=0; partIndex<this.laserCount; partIndex++)
		{
			//radius array, angle array, currentIndex, currentGroupIndex, laserSpeed, lineVertecies
			this.laserData.push([[], [], Math.round(Math.random()*this.pollyFitness), 0, 1, []]);
			for(groupCounter=0; groupCounter<this.pollyCount; groupCounter++)
			{
				//insert radius
				this.laserData[partIndex][0].push(this.radius+(this.incrementBy*groupCounter));
				if(groupCounter==0)
				{
					//insert 1st angle
					nextAngle = (360/this.laserCount)*partIndex;
					this.laserData[partIndex][1].push(nextAngle);
				}
				else
				{
					this.generatedirectionalVectors();
					nextAngle = this.laserData[partIndex][1][groupCounter-1]+(this.directionalVectors[0]*(Math.random()*this.laserRange) );
					this.laserData[partIndex][1].push(nextAngle);
				}
			}
		}
		
		//create guide laser lines
		this.subColourIndex = this.colourIndex;
		this.objectTape.push( new animationObject() );
		this.objectTape[objectIndex].objectID = this.groupName+this.objectIDIndex;
		for(partIndex=0; partIndex<this.laserCount; partIndex++)
		{
			//create starting point
			vertecies = new Array();
			for(groupCounter=0; groupCounter<this.pollyCount; groupCounter++)
			{
				pointPos = this.pixelMap.getElipticalPointsRaw(0, 0, this.laserData[partIndex][0][groupCounter], this.laserData[partIndex][0][groupCounter], this.laserData[partIndex][1][groupCounter]);
				vertecies.push( new THREE.Vector3(pointPos[0], pointPos[1], 0) );
			}
			this.laserData[partIndex][5] = vertecies;
			/*
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
			this.objectTape[objectIndex].materials[partIndex].opacity = this.laserGuideLineopacity;
			//colour
			this.colourObject.getColour( this.subColourIndex%this.colourObject._bandWidth );
			this.objectTape[objectIndex].materials[partIndex].color.r = this.colourObject._currentColour[0]/255;
			this.objectTape[objectIndex].materials[partIndex].color.g = this.colourObject._currentColour[1]/255;
			this.objectTape[objectIndex].materials[partIndex].color.b = this.colourObject._currentColour[2]/255;
			//Object
			this.objectTape[objectIndex].objects.push( new Line2(this.objectTape[objectIndex].geometry[partIndex], this.objectTape[objectIndex].materials[partIndex]) );
			//add to local group
			localGroup.add( this.objectTape[objectIndex].objects[partIndex] );
			*/
		}
		//set colour of actual laser
		this.subColourIndex = this.colourIndex+100;
		objectIndex++;
		
		//create each laser line
		this.objectTape.push( new animationObject() );
		this.objectTape[objectIndex].objectID = this.groupName+this.objectIDIndex;
		for(partIndex=0; partIndex<this.laserCount; partIndex++)
		{
			vertecies = this.laserData[partIndex][5];
			tempCurve = new THREE.CatmullRomCurve3( vertecies );
			lineVertecies = tempCurve.getPoints( this.pollyFitness );
			vertArray = new Array();
			//for(vertIndex=this.laserData[partIndex][2]; vertIndex<this.laserData[partIndex][2]+this.laserLength; vertIndex++)
			//for(vertIndex=0; vertIndex<this.laserLength; vertIndex++)
			for(vertIndex=0; vertIndex<this.pollyFitness; vertIndex++)
			{
				vertArray.push(lineVertecies[vertIndex].x, lineVertecies[vertIndex].y, lineVertecies[vertIndex].z);
			}
			//Geometries
			this.objectTape[objectIndex].geometry.push(  new LineGeometry() );
			this.objectTape[objectIndex].geometry[partIndex].setPositions( vertArray );
			//Material
			this.objectTape[objectIndex].materials.push( new LineMaterial( {color: 0xffffff, linewidth: this.lineThickness, worldUnits: true, vertexColors: false, alphaToCoverage: false} ) );
			this.objectTape[objectIndex].materials[partIndex].transparent = true;
			this.objectTape[objectIndex].materials[partIndex].opacity = 1;
			//colour
			this.colourObject.getColour( this.subColourIndex%this.colourObject._bandWidth );
			this.objectTape[objectIndex].materials[partIndex].color.r = this.colourObject._currentColour[0]/255;
			this.objectTape[objectIndex].materials[partIndex].color.g = this.colourObject._currentColour[1]/255;
			this.objectTape[objectIndex].materials[partIndex].color.b = this.colourObject._currentColour[2]/255;
			//Object
			this.objectTape[objectIndex].objects.push( new Line2(this.objectTape[objectIndex].geometry[partIndex], this.objectTape[objectIndex].materials[partIndex]) );
			if(this.laserBloomEnable==1)
			{
				this.objectTape[objectIndex].objects[partIndex].layers.enable( 1 );
			}
			//add to local group
			localGroup.add( this.objectTape[objectIndex].objects[partIndex] );
			
		}
		//reset colour of orbit layers
		this.subColourIndex = this.colourIndex+100;
		objectIndex++;
		
		//create each layers orbital beam
		this.objectTape.push( new animationObject() );
		this.objectTape[objectIndex].objectID = this.groupName+this.objectIDIndex;
		this.objectTape[objectIndex].rotations = new Array();
		for(partIndex=0; partIndex<this.pollyCount; partIndex++)
		{
			//layer veretices this.objectTape[0].pointData[partIndex]
			tempCurve = new THREE.CatmullRomCurve3( this.objectTape[0].pointData[partIndex] );
			lineVertecies = tempCurve.getPoints( this.pollyFitness );
			vertArray = new Array();
			//for(vertIndex=0; vertIndex<this.orbitLaserLength; vertIndex++)
			for(vertIndex=0; vertIndex<this.pollyFitness; vertIndex++)
			{
				vertArray.push(lineVertecies[vertIndex].x, lineVertecies[vertIndex].y, lineVertecies[vertIndex].z);
			}
			//store rotation index and speed
			this.objectTape[objectIndex].rotations.push([Math.round(Math.random()*this.pollyFitness), Math.round(Math.random())+1]);
			//Geometries
			this.objectTape[objectIndex].geometry.push(  new LineGeometry() );
			this.objectTape[objectIndex].geometry[partIndex].setPositions( vertArray );
			//Material
			this.objectTape[objectIndex].materials.push( new LineMaterial( {color: 0xffffff, linewidth: this.lineThickness, worldUnits: true, vertexColors: false, alphaToCoverage: false} ) );
			this.objectTape[objectIndex].materials[partIndex].transparent = true;
			this.objectTape[objectIndex].materials[partIndex].opacity = 1;
			//colour
			this.colourObject.getColour( this.subColourIndex%this.colourObject._bandWidth );
			this.objectTape[objectIndex].materials[partIndex].color.r = this.colourObject._currentColour[0]/255;
			this.objectTape[objectIndex].materials[partIndex].color.g = this.colourObject._currentColour[1]/255;
			this.objectTape[objectIndex].materials[partIndex].color.b = this.colourObject._currentColour[2]/255;
			//Object
			this.objectTape[objectIndex].objects.push( new Line2(this.objectTape[objectIndex].geometry[partIndex], this.objectTape[objectIndex].materials[partIndex]) );
			if(this.laserBloomEnable==1)
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
}
export default threeLaserLightning;