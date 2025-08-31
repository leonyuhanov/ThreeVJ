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

class threeMotionCylinder
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
		this.dimensions = [50,50,100];
		this.pollyCount = 20;
		this.pollyFitness = 64;
		this.lineThickness = 1;
		this.direction = 1;
		this.lfoSeed = 0;
		this.opacity = 1;
		this.bloomEnable = 1;
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
		this.rotationTrack = [0,0,0];
		this.rotationIndex = [0, 1, 2];
		this.rotationIndexer = 0;
		this.rotating = 0;
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
		//this.lfo.addWithTimeCode("cState", [ 100 ], [100], 0, this.lfoSeed);
	}
	animate = function(colourControls, controlData, rotationalIncrements=[0,0,0])
	{
		//controlData[0]  object scale
		//controlData[1]  width scale
		//controlData[2]  height scale
		//controlData[3]  depth scale
		//controlData[4]  vertex rotation scaler
		//controlData[5]  line width scale
		//controlData[6]  grow speed scale
		//controlData[7]  rotate speed scale

		if(this.setUpStatus==0){return;}	
		var objectIndex=0, partIndex=0;
		var pollyCount=0;
		var zStart = -(this.dimensions[2]/2), rotation=0, rotationSpeed = controlData[7], growSpeed=1;
		
		
		for(partIndex=0; partIndex<this.pollyCount; partIndex++)
		{
			if(this.objectTape[objectIndex].extrude[partIndex][3]==0)
			{
				growSpeed = this.objectTape[objectIndex].extrude[partIndex][2]*controlData[6];
				if(this.direction==1)
				{
					if(this.objectTape[objectIndex].extrude[partIndex][1]+growSpeed>=this.objectTape[objectIndex].extrude[partIndex][0])
					{
						this.objectTape[objectIndex].extrude[partIndex][1] = this.objectTape[objectIndex].extrude[partIndex][0];
						this.objectTape[objectIndex].extrude[partIndex][3] = 1; 
					}
					else
					{
						this.objectTape[objectIndex].extrude[partIndex][1]+=growSpeed;
					}
				}
				else if(this.direction==-1)
				{
					if(this.objectTape[objectIndex].extrude[partIndex][1]+growSpeed<=zStart)
					{
						this.objectTape[objectIndex].extrude[partIndex][1] = zStart;
						this.objectTape[objectIndex].extrude[partIndex][3] = 1; 
					}
					else
					{
						this.objectTape[objectIndex].extrude[partIndex][1]+=growSpeed;
					}
				}
				this.objectTape[objectIndex].objects[partIndex].position.z = this.objectTape[objectIndex].extrude[partIndex][1];
			}
			this.objectTape[objectIndex].materials[partIndex].linewidth = this.lineThickness*controlData[5];
		}
		//check if all pollys are in place then reverse
		for(partIndex=0; partIndex<this.pollyCount; partIndex++)
		{
			if(this.objectTape[objectIndex].extrude[partIndex][3]>0)
			{
				pollyCount++;
			}
		}
		//if all the pollys are in place start the rotation
		if(pollyCount==this.pollyCount)
		{
			if(this.rotating==0)
			{
				this.rotating=1;
				for(partIndex=0; partIndex<this.pollyCount; partIndex++)
				{
					this.objectTape[objectIndex].extrude[partIndex][3] = 2;
				}
			}
			if(this.rotating==1)
			{
				rotation = this.rotationTrack[ this.rotationIndex[this.rotationIndexer] ];
				if(rotation+rotationSpeed<=90)
				{
					rotation+=rotationSpeed;
					this.rotationTrack[ this.rotationIndex[this.rotationIndexer] ] = rotation;
					if(this.rotationIndexer==0)
					{
						//rotate X
						this.globalObjectGroup.rotateX( this.angleToRadian(rotationSpeed) );
					}
					else if(this.rotationIndexer==1)
					{
						//rotate y
						this.globalObjectGroup.rotateY( this.angleToRadian(rotationSpeed) );
					}
					else if(this.rotationIndexer==2)
					{
						//rotate z
						this.globalObjectGroup.rotateZ( this.angleToRadian(rotationSpeed) );
					}
				}
				else
				{
					this.rotationIndexer = (this.rotationIndexer+1)%this.rotationIndex.length;
					this.rotationTrack[ this.rotationIndex[this.rotationIndexer] ] = 0;
					this.rotating=0;
					if(this.direction==1)
					{
						this.direction = -1;
					}
					else
					{
						this.direction = 1;
					}
					for(partIndex=0; partIndex<this.pollyCount; partIndex++)
					{
						this.objectTape[objectIndex].extrude[partIndex][3] = 0;
						this.objectTape[objectIndex].extrude[partIndex][2] = this.objectTape[objectIndex].extrude[partIndex][2]*-1;
					}
				}
			}
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
		var objectIndex=0, partIndex=0, vertIndex=0;
		var pointPos;
		var vertecies = new Array(), tempCurve, lineVertecies, vertArray;
		var localGroup = new THREE.Object3D();
		var zStart = -(this.dimensions[2]/2), zPos=0;
		
		this.subColourIndex = this.colourIndex;
		
		this.objectTape.push( new animationObject() );
		this.objectTape[objectIndex].objectID = this.groupName+this.objectIDIndex;
		for(partIndex=0; partIndex<this.pollyCount; partIndex++)
		{
			//pollyanimation controls
			//Default ZPOZ, current Position, increment, done/notdone
			zPos = zStart+(((this.dimensions[2]*2)/this.pollyCount)*partIndex);
			this.objectTape[objectIndex].extrude.push([zPos, zStart, 1+(0.2*partIndex), 0]);
			vertecies = new Array();
			for(vertIndex=0; vertIndex<this.pollyFitness; vertIndex++)
			{
				pointPos = this.pixelMap.getElipticalPointsRaw(0, 0, this.dimensions[0], this.dimensions[1], (360/this.pollyFitness)*vertIndex);
				vertecies.push( new THREE.Vector3(pointPos[0], pointPos[1], zStart) );
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
				if(partIndex%this.bloomOn==this.bloomOn-1)
				{
					this.objectTape[objectIndex].objects[partIndex].layers.enable( 1 );
				}
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
export default threeMotionCylinder;