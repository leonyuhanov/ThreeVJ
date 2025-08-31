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

class threeLineBeamGrid
{	
	constructor()
	{
		//Main object stores
		this.objectTape = new Array();
		this.globalGroupArray = new Array();
		this.globalObjectGroup = new THREE.Object3D();
		this.groupName = "LBG_";
		this.objectIDIndex = 0;
		this.genObject = new animationObject();
		
		//Global Three Objects form main System
		this.scene;
		
		//Main properties
		this.origin = [0,0,0];
		this.dimensions = [5, 5];	//x, z
		this.beamSpace = 100;
		this.defaultBeamWidth = 2;
		this.defaultBeamLength = 100;
		this.defaultLineOpacity = 1;
		this.pumpFiness = 1;
		this.pumpDimensions = [10, 10, 2];	//pump circle around beam x, y, line thickness
		this.lfoSeed = 0;
		this.beamBloomEnable = 0;
		this.pumpBloomEnable = 1;		
		this.pollyFiness = 720;
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
		this.defaultColour = 0xffffff;
	}
	init = function(scene, colourIndex)
	{
		this.scene = scene;
		this.colourIndex = colourIndex;
		this.subColourIndex = this.colourIndex;
		//this.lfo.addWithTimeCode("opacityLFO", [ 100 ], [100], 0, 0);
	}
	animate = function(colourControls, controlData, rotationalIncrements=[0,0,0])
	{
		//controlData[0]  object scale
		//controlData[1]  width scale
		//controlData[2]  height scale
		//controlData[3]  depth scale
		//controlData[4]  pump speed
		
		if(this.setUpStatus==0){return;}				
		var objectIndex=0, partIndex=0, colCounter, rowCounter, beamIndex=0;
		
		for(partIndex=0; partIndex<this.objectTape[objectIndex].objects.length; partIndex+=2)
		{
			if(this.objectTape[objectIndex].pointData[beamIndex][0]+(controlData[4]*this.objectTape[objectIndex].pointData[beamIndex][1])>this.defaultBeamLength*2)
			{
				this.objectTape[objectIndex].pointData[beamIndex][0] = 0
			}
			else
			{
				this.objectTape[objectIndex].pointData[beamIndex][0] = this.objectTape[objectIndex].pointData[beamIndex][0]+(controlData[4]*this.objectTape[objectIndex].pointData[beamIndex][1]);
			}
			this.objectTape[objectIndex].objects[partIndex+1].position.y =  -this.defaultBeamLength+this.objectTape[objectIndex].pointData[beamIndex][0];
			//pump Colour
			this.setMaterialColour(this.objectTape[objectIndex].materials[partIndex+1], this.subColourIndex);
			this.subColourIndex+=colourControls[1];
			beamIndex++;
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
		var objectIndex=0, partIndex=0, colCounter, rowCounter, beamIndex=0;
		var startPoints = [-((this.dimensions[0]*this.beamSpace)/2), -((this.dimensions[1]*this.beamSpace)/2)]
		var pointPos, vertIndex, vertecies = new Array();
		var localGroup = new THREE.Object3D();
				
		//create the primary shape to be used for the extrude 
		this.objectTape.push( new animationObject() );
		this.objectTape[objectIndex].objectID = this.groupName+this.objectIDIndex;
		//create the grid of evenly spaced lines
		for(rowCounter=0; rowCounter<this.dimensions[1]; rowCounter++)
		{
			for(colCounter=0; colCounter<this.dimensions[0]; colCounter++)
			{
				// main line beam
				vertecies = new Array();
				vertecies.push( startPoints[0]+(colCounter*this.beamSpace), this.defaultBeamLength, startPoints[0]+(rowCounter*this.beamSpace) );
				vertecies.push( startPoints[0]+(colCounter*this.beamSpace), -this.defaultBeamLength, startPoints[0]+(rowCounter*this.beamSpace) );
				//Geometries
				this.objectTape[objectIndex].geometry.push(  new LineGeometry() );
				this.objectTape[objectIndex].geometry[partIndex].setPositions ( vertecies );
				//Material
				this.objectTape[objectIndex].materials.push( new LineMaterial( {color: this.defaultColour, linewidth: this.defaultBeamWidth, worldUnits: true, vertexColors: false, alphaToCoverage: false} ) );
				//this.objectTape[objectIndex].extrude.push(Math.random());
				this.objectTape[objectIndex].materials[partIndex].transparent = true;
				this.objectTape[objectIndex].materials[partIndex].opacity = this.defaultLineOpacity; //this.objectTape[objectIndex].extrude[beamIndex];
				//Object
				this.objectTape[objectIndex].objects.push( new Line2(this.objectTape[objectIndex].geometry[partIndex], this.objectTape[objectIndex].materials[partIndex]) );
				if(this.beamBloomEnable==1)
				{
					this.objectTape[objectIndex].objects[partIndex].layers.enable( 1 );
				}
				//add to local group
				localGroup.add( this.objectTape[objectIndex].objects[partIndex] );
				partIndex++;
				
				//circular pump
				this.objectTape[objectIndex].pointData.push([Math.random()*(this.defaultBeamLength*2), (Math.random()*2)+0.1]); // pumps position on the line
				vertecies = new Array();
				for(vertIndex=0; vertIndex<360; vertIndex+=this.pumpFiness)
				{
					pointPos = this.pixelMap.getElipticalPointsRaw(0, 0, this.pumpDimensions[0], this.pumpDimensions[1], vertIndex);
					vertecies.push(pointPos[0], pointPos[1], 0);					
				}
				//Geometries
				this.objectTape[objectIndex].geometry.push(  new LineGeometry() );
				this.objectTape[objectIndex].geometry[partIndex].setPositions ( vertecies );
				//Material
				this.objectTape[objectIndex].materials.push( new LineMaterial( {color: this.defaultColour, linewidth: this.pumpDimensions[2], worldUnits: true, vertexColors: false, alphaToCoverage: false} ) );
				this.objectTape[objectIndex].materials[partIndex].transparent = true;
				this.objectTape[objectIndex].materials[partIndex].opacity = 1;
				//Object
				this.objectTape[objectIndex].objects.push( new Line2(this.objectTape[objectIndex].geometry[partIndex], this.objectTape[objectIndex].materials[partIndex]) );
				this.objectTape[objectIndex].objects[partIndex].rotateX( this.angleToRadian(90) );
				this.objectTape[objectIndex].objects[partIndex].position.set(startPoints[0]+(colCounter*this.beamSpace),-this.defaultBeamLength+this.objectTape[objectIndex].pointData[beamIndex][0] , startPoints[0]+(rowCounter*this.beamSpace));
				if(this.pumpBloomEnable==1)
				{
					this.objectTape[objectIndex].objects[partIndex].layers.enable( 1 );
				}
				//add to local group
				localGroup.add( this.objectTape[objectIndex].objects[partIndex] );
				partIndex++;
				beamIndex++;
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
export default threeLineBeamGrid;