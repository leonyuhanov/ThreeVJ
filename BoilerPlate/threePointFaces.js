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

class threePointFaces
{	
	constructor()
	{
		//Main object stores
		this.objectTape = new Array();
		this.globalGroupArray = new Array();
		this.globalObjectGroup = new THREE.Object3D();
		this.groupName = "PF_";
		this.objectIDIndex = 0;
		this.genObject = new animationObject();
		
		//Global Three Objects form main System
		this.scene;
		
		//Main properties
		this.origin = [0,0,0];
		this.dimensions = [100,100,100];
		this.angularRange = 10;
		this.pollyCount = 2;
		this.pointGuides = new Array();
		this.pointCloudCount = 2;
		this.trailCount = 5;
		this.pointCloudData = new Array();
		this.pollyFitness = 128;
		this.maxPollyFitness = 0;
		this.totalAngles = 360;
		this.lineThickness = 1;
		this.laserLineThickness = 1;
		this.boundingObjectOpacity = 1;
		this.guideLineOpacity = 1;
		this.lfoSeed = 0;
		this.bloomEnable = 0;
		this.pointBloomEnable = 1;
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
		this.speedFactor = 5;
		this.frameIndex = 0;
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
		this.lfo.addWithTimeCode("radius", [ 100 ], [100], 0, this.lfoSeed);
		//this.maxPollyFitness = this.pollyFitness*4;
	}
	animate = function(colourControls, controlData, rotationalIncrements=[0,0,0])
	{
		
		//controlData[0]  object scale
		//controlData[1]  width scale
		//controlData[2]  height scale
		//controlData[3]  depth scale
		//controlData[4]  line width scale
		//controlData[5]  radius lfo phase
		//controlData[6]  radius lfo speed
		//controlData[7]  point Speed
		//controlData[8]  guide circle point angle rotation increment
		//controlData[9]  centre laser thickness


		if(this.setUpStatus==0){return;}
		
		var objectIndex=0, partIndex=0, vertIndex=0, trailIndex=0, pointIndex=0, groupCounter=0;
		var tempCurve, vertArray, vertecies, lineVertecies, pointPos;
		var lfoStartIndex = this.lfo.getTimeCode("radius");
		var lfoIndex = lfoStartIndex;
		var currentRadius = [0,0], currentSpeed=0;
		var zIndex = -(this.dimensions[2]/2), zIncrement = this.dimensions[2]/this.pollyCount;
		
		//recalculate bounding spheres based on lfo
		//set object index to 0 for the bounding spheres
		objectIndex=0;
		for(partIndex=0; partIndex<this.pollyCount; partIndex++)
		{
			vertecies = new Array();
			currentRadius[0] = (this.dimensions[0]*(this.lfo.read("radius", 0, lfoIndex)/100))+10;
			currentRadius[1] = (this.dimensions[1]*(this.lfo.read("radius", 0, lfoIndex)/100))+10;
			lfoIndex += controlData[5];
			for(vertIndex=0; vertIndex<this.pollyFitness; vertIndex++)
			{
				pointPos = this.pixelMap.getElipticalPointsRaw(0, 0, currentRadius[0], currentRadius[1], (this.totalAngles/this.pollyFitness)*vertIndex);
				vertecies.push( new THREE.Vector3(pointPos[0], pointPos[1], zIndex+(zIncrement*partIndex)) );
			}
			vertecies.push(vertecies[0]);
			//create the line
			tempCurve = new THREE.CatmullRomCurve3( vertecies );
			lineVertecies = tempCurve.getPoints( this.pollyFitness );
			vertArray = new Array();
			for(vertIndex=0; vertIndex<lineVertecies.length; vertIndex++)
			{
				vertArray.push(lineVertecies[vertIndex].x, lineVertecies[vertIndex].y, lineVertecies[vertIndex].z)
			}
			//Geometries
			this.objectTape[objectIndex].geometry[partIndex].dispose();
			this.objectTape[objectIndex].geometry[partIndex].setPositions( vertArray );
		}
		
		//recalculate guide lines
		//set object index to 1 for the guide lines
		objectIndex=1;
		//update the guide data radius via lfos
		for(partIndex=0; partIndex<this.pointCloudCount; partIndex++)
		{
			//radius array, angle array, currentIndex, laserSpeed, lineVertecies, rotationVector
			lfoIndex = lfoStartIndex;
			for(groupCounter=0; groupCounter<this.pollyCount; groupCounter++)
			{
				//insert radius
				currentRadius[0] = (this.dimensions[0]*(this.lfo.read("radius", 0, lfoIndex)/100))+10;
				lfoIndex += controlData[5];
				this.pointGuides[partIndex][0][groupCounter] = currentRadius[0];
			}
		}
		//increment the lfo
		this.lfo.setTimeCode("radius", lfoStartIndex+controlData[6]);
		for(partIndex=0; partIndex<this.pointCloudCount; partIndex++)
		{
			//create starting point
			vertecies = new Array();
			for(groupCounter=0; groupCounter<this.pollyCount; groupCounter++)
			{
				pointPos = this.pixelMap.getElipticalPointsRaw(0, 0, this.pointGuides[partIndex][0][groupCounter], this.pointGuides[partIndex][0][groupCounter], this.pointGuides[partIndex][1][groupCounter]);
				vertecies.push( new THREE.Vector3(pointPos[0], pointPos[1], zIndex+(zIncrement*groupCounter)) );
			}
			this.pointGuides[partIndex][4] = vertecies;
			/*
			tempCurve = new THREE.CatmullRomCurve3( vertecies );
			lineVertecies = tempCurve.getPoints( this.pollyFitness );
			vertArray = new Array();
			for(vertIndex=0; vertIndex<lineVertecies.length; vertIndex++)
			{
				vertArray.push(lineVertecies[vertIndex].x, lineVertecies[vertIndex].y, lineVertecies[vertIndex].z)
			}
			//Geometries
			this.objectTape[objectIndex].geometry[partIndex].dispose();
			this.objectTape[objectIndex].geometry[partIndex].setPositions( vertArray );
			*/
		}
		
		//set object index to 2 for the Points
		objectIndex=2;
		//increment point index
		currentSpeed = Math.round((this.speedFactor*controlData[7])+1);
		if(this.frameIndex%currentSpeed==currentSpeed-1)
		{
			//radius array, angle array, currentIndex, laserSpeed, lineVertecies, rotationVector
			for(partIndex=0; partIndex<this.pointCloudCount; partIndex++)
			{
				//radius array, angle array, currentIndex, laserSpeed, lineVertecies
				if(this.pointGuides[partIndex][2]+this.pointGuides[partIndex][3]<this.maxPollyFitness)
				{
					this.pointGuides[partIndex][2] = (this.pointGuides[partIndex][2]+this.pointGuides[partIndex][3])%this.maxPollyFitness;
				}
				else
				{
					this.pointGuides[partIndex][2] = (this.pointGuides[partIndex][2]+this.pointGuides[partIndex][3])-this.maxPollyFitness;
				}
				for(groupCounter=0; groupCounter<this.pointGuides[partIndex][1].length; groupCounter++)
				{
					this.pointGuides[partIndex][1][groupCounter]+=controlData[8]*this.pointGuides[partIndex][5];
				}
			}
		}
		//motion with trails
		for(trailIndex=0; trailIndex<this.trailCount; trailIndex++)
		{
			vertArray = new Array();
			for(partIndex=0; partIndex<this.pointCloudCount; partIndex++)
			{
				//radius array, angle array, currentIndex, laserSpeed, lineVertecies
				pointIndex = this.pointGuides[partIndex][2];
				if(pointIndex+trailIndex<this.maxPollyFitness)
				{
					pointIndex = (pointIndex+trailIndex)%this.maxPollyFitness;
				}
				else
				{
					pointIndex = (pointIndex+trailIndex)-this.maxPollyFitness;
				}
				//grab cuurent points Location from its guide line
				tempCurve = new THREE.CatmullRomCurve3( this.pointGuides[partIndex][4] );			
				vertArray.push( tempCurve.getPoint( pointIndex/this.maxPollyFitness ) );
			}
			//Geometries
			this.objectTape[objectIndex].geometry[trailIndex].setFromPoints( vertArray );
			//colour
			this.colourObject.getColour( this.subColourIndex%this.colourObject._bandWidth );
			this.objectTape[objectIndex].materials[trailIndex].color.r = this.colourObject._currentColour[0]/255;
			this.objectTape[objectIndex].materials[trailIndex].color.g = this.colourObject._currentColour[1]/255;
			this.objectTape[objectIndex].materials[trailIndex].color.b = this.colourObject._currentColour[2]/255;
			this.subColourIndex+=colourControls[1];
		}
		//motion of centre line laser points
		//set object index to 3 for laser lines
		/*
		objectIndex=3;
		for(partIndex=0; partIndex<this.pointCloudCount; partIndex++)
		{
			pointIndex = (this.pointGuides[partIndex][2]+this.trailCount)%this.maxPollyFitness;
			vertecies = new Array();
			tempCurve = new THREE.CatmullRomCurve3( this.pointGuides[partIndex][4] );
			vertecies.push( tempCurve.getPoint( pointIndex/this.maxPollyFitness ) );
			vertecies.push( new THREE.Vector3(0,0,vertecies[0].z) );
			tempCurve = new THREE.CatmullRomCurve3( vertecies );
			lineVertecies = tempCurve.getPoints( 2 );
			vertArray = new Array();
			for(vertIndex=0; vertIndex<lineVertecies.length; vertIndex++)
			{
				vertArray.push(lineVertecies[vertIndex].x, lineVertecies[vertIndex].y, lineVertecies[vertIndex].z)
			}
			//Geometries
			this.objectTape[objectIndex].geometry[partIndex].dispose();
			this.objectTape[objectIndex].geometry[partIndex].setPositions( vertArray );
			//colour
			this.colourObject.getColour( this.subColourIndex%this.colourObject._bandWidth );
			this.objectTape[objectIndex].materials[partIndex].color.r = this.colourObject._currentColour[0]/255;
			this.objectTape[objectIndex].materials[partIndex].color.g = this.colourObject._currentColour[1]/255;
			this.objectTape[objectIndex].materials[partIndex].color.b = this.colourObject._currentColour[2]/255;
			//line thickness
			this.objectTape[objectIndex].materials[partIndex].linewidth = this.laserLineThickness*controlData[9];
			this.subColourIndex+=colourControls[1];
		}
		*/
		//global rotation		
		this.globalObjectGroup.rotateX( this.angleToRadian(rotationalIncrements[0]) );
		this.globalObjectGroup.rotateY( this.angleToRadian(rotationalIncrements[1]) );
		this.globalObjectGroup.rotateZ( this.angleToRadian(rotationalIncrements[2]) );
		//scale
		this.globalObjectGroup.scale.set(controlData[0]*controlData[1], controlData[0]*controlData[2], controlData[0]*controlData[3]); 

		this.colourIndex += colourControls[0];
		this.subColourIndex = this.colourIndex;
		this.frameIndex++;
	}
	insertObject = function()
	{
		var objectIndex=0, partIndex=0, vertIndex=0, groupCounter=0, trailIndex=0, pointIndex=0;
		var pointPos, nextAngle;
		var vertecies = new Array(), tempCurve, lineVertecies, vertArray;
		var localGroup = new THREE.Object3D();
		var zIndex = -(this.dimensions[2]/2), zIncrement = this.dimensions[2]/this.pollyCount;
		var tempPoint;
		
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
				pointPos = this.pixelMap.getElipticalPointsRaw(0, 0, this.dimensions[0], this.dimensions[1], (this.totalAngles/this.pollyFitness)*vertIndex);
				vertecies.push( new THREE.Vector3(pointPos[0], pointPos[1], zIndex+(zIncrement*partIndex)) );
			}
			vertecies.push(vertecies[0]);
			//create the line
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
			this.objectTape[objectIndex].materials[partIndex].opacity = this.boundingObjectOpacity;
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
			
		}		
		//set up the point guide lines data
		for(partIndex=0; partIndex<this.pointCloudCount; partIndex++)
		{
			//radius array, angle array, currentIndex, laserSpeed, lineVertecies, rotationVector
			this.generatedirectionalVectors();
			this.pointGuides.push([[], [], Math.round(Math.random()*this.maxPollyFitness), 1, [], this.directionalVectors[0]]);
			for(groupCounter=0; groupCounter<this.pollyCount; groupCounter++)
			{
				//insert radius
				this.pointGuides[partIndex][0].push(this.dimensions[0]);
				if(groupCounter==0)
				{
					//insert 1st angle
					nextAngle = (this.totalAngles/this.pointCloudCount)*partIndex;
					this.pointGuides[partIndex][1].push(nextAngle);
				}
				else
				{
					this.generatedirectionalVectors();
					nextAngle = this.pointGuides[partIndex][1][groupCounter-1]+(this.directionalVectors[0]*(Math.random()*this.angularRange) );
					this.pointGuides[partIndex][1].push(nextAngle);
				}
			}
		}
		
		//create guide lines for each point group
		objectIndex++;
		this.subColourIndex = this.colourIndex+200;
		this.objectTape.push( new animationObject() );
		this.objectTape[objectIndex].objectID = this.groupName+this.objectIDIndex;
		for(partIndex=0; partIndex<this.pointCloudCount; partIndex++)
		{
			//create starting point
			vertecies = new Array();
			for(groupCounter=0; groupCounter<this.pollyCount; groupCounter++)
			{
				pointPos = this.pixelMap.getElipticalPointsRaw(0, 0, this.pointGuides[partIndex][0][groupCounter], this.pointGuides[partIndex][0][groupCounter], this.pointGuides[partIndex][1][groupCounter]);
				vertecies.push( new THREE.Vector3(pointPos[0], pointPos[1], zIndex+(zIncrement*groupCounter)) );
			}
			this.pointGuides[partIndex][4] = vertecies;
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
			this.objectTape[objectIndex].materials[partIndex].opacity = this.guideLineOpacity;
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
		
		//------------
		//create each point Cloud with its trails
		this.objectTape.push( new animationObject() );
		objectIndex++;
		//set colour point cloud
		this.subColourIndex = this.colourIndex;
		this.objectTape[objectIndex].objectID = this.groupName+this.objectIDIndex;
		for(trailIndex=0; trailIndex<this.trailCount; trailIndex++)
		{
			vertArray = new Array();
			for(partIndex=0; partIndex<this.pointCloudCount; partIndex++)
			{
				//radius array, angle array, currentIndex, laserSpeed, lineVertecies, rotationVector
				//grap cuurent points Location from its guide line
				if(this.pointGuides[partIndex][2]-trailIndex>=0)
				{
					pointIndex = this.pointGuides[partIndex][2]-trailIndex;
				}
				else
				{
					this.pointGuides[partIndex][2] = this.maxPollyFitness+(this.pointGuides[partIndex][2]-trailIndex)
				}
				tempCurve = new THREE.CatmullRomCurve3( this.pointGuides[partIndex][4] );
				vertArray.push( tempCurve.getPoint( pointIndex/this.maxPollyFitness ) );			
			}
			//Geometries
			this.objectTape[objectIndex].geometry.push(  new THREE.BufferGeometry().setFromPoints(  vertArray ) );
			//Material
			this.objectTape[objectIndex].materials.push( new THREE.PointsMaterial( {color: 0xffffff, map: this.sprite, transparent: true} ) );
			this.objectTape[objectIndex].materials[trailIndex].transparent = true;
			this.objectTape[objectIndex].materials[trailIndex].opacity = trailIndex/this.trailCount;
			//clouds particles size
			this.objectTape[objectIndex].materials[trailIndex].size = 2;
			//colour
			this.colourObject.getColour( this.subColourIndex%this.colourObject._bandWidth );
			this.objectTape[objectIndex].materials[trailIndex].color.r = this.colourObject._currentColour[0]/255;
			this.objectTape[objectIndex].materials[trailIndex].color.g = this.colourObject._currentColour[1]/255;
			this.objectTape[objectIndex].materials[trailIndex].color.b = this.colourObject._currentColour[2]/255;
			//Object
			this.objectTape[objectIndex].objects.push( new THREE.Points(this.objectTape[objectIndex].geometry[trailIndex], this.objectTape[objectIndex].materials[trailIndex]) );
			if(this.pointBloomEnable==1)
			{
				this.objectTape[objectIndex].objects[trailIndex].layers.enable( 1 );
			}
			//add to local group
			localGroup.add( this.objectTape[objectIndex].objects[trailIndex] );
		}
		//------------
		/*
		//create point lines from the 1st point to the centre axis
		this.objectTape.push( new animationObject() );
		objectIndex++;
		this.subColourIndex = this.colourIndex;
		this.objectTape[objectIndex].objectID = this.groupName+this.objectIDIndex;
		for(partIndex=0; partIndex<this.pointCloudCount; partIndex++)
		{
			vertecies = new Array();
			tempCurve = new THREE.CatmullRomCurve3( this.pointGuides[partIndex][4] );
			vertecies.push( tempCurve.getPoint( this.pointGuides[partIndex][2]/this.maxPollyFitness ) );
			vertecies.push( new THREE.Vector3(0,0,vertecies[0].z) );
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
			this.objectTape[objectIndex].materials[partIndex].opacity = 1;
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
		}
		*/
		//reset colour of orbit layers
		this.subColourIndex = this.colourIndex+100;
		objectIndex++;
		
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
export default threePointFaces;