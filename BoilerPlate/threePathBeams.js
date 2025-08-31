import * as THREE from 'three';
import envelopGenerator from './envelopGenerator.js';					//Envelop Generator
import CCGenerator from './CCGenerator.js';								//Colour System
import timerObject from './timerObject.js';								//Timers
import pixelMaper from './pixelMaper.js';								//Pixel Maper
import animationObject from './animationObject.js';						//Generic Object Tracking class
import ElipticalEnvelopGenerator from './ElipticalEnvelopGenerator.js';

class threePathBeams
{	
	constructor()
	{
		//Main object stores
		this.objectTape = new Array();
		this.globalGroupArray = new Array();
		this.globalObjectGroup = new THREE.Object3D();
		this.groupName = "PB_";
		this.objectIDIndex = 0;
		this.genObject = new animationObject();
		
		//Global Three Objects form main System
		this.scene;
		
		//Main properties
		this.origin = [0,0,0];
		this.pathDimensions = [200, 200];
		this.beamCount = 10;
		this.beamDimensions = [1, 1, 10];
		this.maxSpeed = 1;
		this.bloomEnable = 0;
		this.bloomOnCount = 3;
		this.multiObject = 0;
		this.setUpStatus = 0;
		
		//Utility Objects
		this.pixelMap = new pixelMaper(2,2);
		this.screenRange = [300,200,300];
		this.timers = new timerObject();
		this.envelops = new envelopGenerator();
		this.lfo = new ElipticalEnvelopGenerator();
		this.directionalVectors = [1,1,1];
		
		//Colour System
		this.colourIndex = 0;
		this.subColourIndex = 0;
		this.maxValue = 255;
		this.maxColourDitherSteps = 128;
		this.colourList_1 = [this.maxValue,0,0,this.maxValue,this.maxValue,0, 0,this.maxValue,0, 0,this.maxValue,this.maxValue, 0,0,this.maxValue, this.maxValue,0,this.maxValue, this.maxValue,this.maxValue,this.maxValue];
		this.colourObject = new CCGenerator(this.maxColourDitherSteps, this.colourList_1.length/3, this.colourList_1);
	}
	init = function(scene, colourIndex, lfoIndex)
	{
		this.scene = scene;
		this.colourIndex = colourIndex;
		this.lfo.addWithTimeCode("radiusScaler", [100], [100], 0, lfoIndex%100);
	}
	animate = function(colourControls, controlData, rotationalIncrements=[0,0,0])
	{
		//controlData[0] object scale
		//controlData[1] motion speed scale
		//controlData[2] path width scale
		//controlData[3] path height scale
		//controlData[4] beam thickness scale
		//controlData[5] beam length scale
		//controlData[6] lfoSpeed

		if(this.setUpStatus==0){return;}
		var objectIndex=0, partIndex=0, pointPos=0, objectAngle=0, beamSpeed=0;
		var lfoScaler = this.lfo.read("radiusScaler", controlData[6]+0.00001, 0)/100;
		var objectScalers = [(this.pathDimensions[0]*controlData[2]*lfoScaler)*controlData[0], (this.pathDimensions[1]*controlData[3]*lfoScaler)*controlData[0]]
		
		for(partIndex=0; partIndex<this.beamCount; partIndex++)
		{
			beamSpeed = (this.objectTape[objectIndex].extrude[partIndex][1]*this.objectTape[objectIndex].extrude[partIndex][2])*controlData[1];
			objectAngle = this.objectTape[objectIndex].extrude[partIndex][0]+beamSpeed;
			this.objectTape[objectIndex].extrude[partIndex][0] = objectAngle;
			pointPos = this.pixelMap.getElipticalPointsRaw(0, 0, objectScalers[0], objectScalers[1], objectAngle);	
			this.objectTape[objectIndex].objects[partIndex].setRotationFromEuler( new THREE.Euler( 0, 0, 0, 'XYZ' ));
			this.objectTape[objectIndex].objects[partIndex].rotateY( this.angleToRadian( 90 ) );
			this.objectTape[objectIndex].objects[partIndex].rotateX( this.angleToRadian( 180-objectAngle ) );
			//position
			this.objectTape[objectIndex].objects[partIndex].position.set(pointPos[0], pointPos[1], 0);
			//beam scale
			this.objectTape[objectIndex].objects[partIndex].scale.set(this.beamDimensions[0]*controlData[4], this.beamDimensions[1]*controlData[4], this.beamDimensions[2]*controlData[5]);
		}
		
		this.colourIndex += colourControls[0];
		this.subColourIndex = this.colourIndex;
		
		
		//this.globalObjectGroup.rotateX( (rotationalIncrements[0])*(Math.PI/180) );
		//this.globalObjectGroup.rotateY( (rotationalIncrements[1])*(Math.PI/180) );
		//this.globalObjectGroup.rotateZ( (rotationalIncrements[2])*(Math.PI/180) );	
	}
	insertObject = function()
	{
		var objectIndex=0, partIndex=0, pointPos=0, objectAngle=0;
		var localGroup = new THREE.Object3D();
		
		this.objectTape.push( new animationObject() );
		this.objectTape[objectIndex].objectID = this.groupName+this.objectIDIndex;
		
		for(partIndex=0; partIndex<this.beamCount; partIndex++)
		{
			//objects position on circlular path
			objectAngle = (360/this.beamCount)*partIndex;
			pointPos = this.pixelMap.getElipticalPointsRaw(0, 0, this.pathDimensions[0], this.pathDimensions[1], objectAngle);		
			//beam speed
			this.generatedirectionalVectors();
			this.objectTape[objectIndex].extrude.push( [objectAngle, (Math.random()*this.maxSpeed)+(this.maxSpeed*0.1), this.directionalVectors[0]] );
			//Object creation
			this.objectTape[objectIndex].geometry.push( new THREE.BoxGeometry(1, 1, 1) );
			this.objectTape[objectIndex].materials.push( new THREE.MeshLambertMaterial( {color: 0xffffff} ) );
			this.objectTape[objectIndex].materials[partIndex].transparent = true;
			this.objectTape[objectIndex].materials[partIndex].opacity = 1;
			//colour
			this.colourObject.getColour( (this.colourIndex+(10*partIndex))%this.colourObject._bandWidth );
			this.objectTape[objectIndex].materials[partIndex].color.r = this.colourObject._currentColour[0]/255;
			this.objectTape[objectIndex].materials[partIndex].color.g = this.colourObject._currentColour[1]/255;
			this.objectTape[objectIndex].materials[partIndex].color.b = this.colourObject._currentColour[2]/255;
			this.objectTape[objectIndex].objects.push( new THREE.Mesh(this.objectTape[objectIndex].geometry[partIndex], this.objectTape[objectIndex].materials[partIndex]) );
			this.objectTape[objectIndex].objects[partIndex].scale.set(this.beamDimensions[0], this.beamDimensions[1], this.beamDimensions[2]);
			//rotate beam to its angle
			this.objectTape[objectIndex].objects[partIndex].rotateY( this.angleToRadian( 90 ) );
			this.objectTape[objectIndex].objects[partIndex].rotateX( this.angleToRadian( 180-objectAngle ) );
			if(this.bloomEnable==1)
			{
				if(partIndex%this.bloomOnCount==this.bloomOnCount-1)
				{
					this.objectTape[objectIndex].objects[partIndex].layers.enable( 1 );
				}
			}
			//position
			this.objectTape[objectIndex].objects[partIndex].position.set(pointPos[0], pointPos[1], 0);
			//add to local group
			localGroup.add( this.objectTape[objectIndex].objects[partIndex] );
				
		}
		//rotations
		//localGroup.rotateX( this.angleToRadian( this.rotateTo[0] ) );
		//localGroup.rotateY( this.angleToRadian( this.rotateTo[1] ) );
		//localGroup.rotateZ( this.angleToRadian( this.rotateTo[2] ) );
		
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
export default threePathBeams;