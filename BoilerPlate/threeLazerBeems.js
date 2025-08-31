import * as THREE from 'three';
import envelopGenerator from './envelopGenerator.js';					//Envelop Generator
import CCGenerator from './CCGenerator.js';								//Colour System
import timerObject from './timerObject.js';								//Timers
import pixelMaper from './pixelMaper.js';								//Pixel Maper
import animationObject from './animationObject.js';						//Generic Object Tracking class
import ElipticalEnvelopGenerator from './ElipticalEnvelopGenerator.js';

class threeLazerBeems
{	
	constructor()
	{
		//Main object stores
		this.objectTape = new Array();
		this.globalGroupArray = new Array();
		this.globalObjectGroup = new THREE.Object3D();
		this.groupName = "LB_";
		this.objectIDIndex = 0;
		this.genObject = new animationObject();
		
		//Global Three Objects form main System
		this.scene;
		
		//Main properties
		this.origin = [0,0,0];
		this.circularDimensions = [100,100];
		this.innerLimit = [10,10];
		this.outerLimit = [200,200];
		this.numberOfBeams = 1;
		this.evenDistribution = 1;
		this.beamDimensions = [1,1,100];
		this.rotateTo = [0,0,0];
		this.direction = 0;
		this.bloomEnable = 0;
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
	init = function(scene, colourIndex)
	{
		this.scene = scene;
		this.colourIndex = colourIndex;
	}
	animate = function(colourControls, controlData, rotationalIncrements=[0,0,0])
	{
		//controlData[0] object scale
		//controlData[1] motion speed scale
		if(this.setUpStatus==0){return;}
		
		var objectIndex=0, beamIndex=0;
		var pointPos, tempLength=0, beamAngle=0, beamSpeed=0;
		var localInnerLimit = [(this.innerLimit[0]*controlData[0])*controlData[5], (this.innerLimit[1]*controlData[0])*controlData[5]];
		var localOuterLimit = [this.outerLimit[0]*controlData[0], this.outerLimit[1]*controlData[0]];
		
		for(beamIndex=0; beamIndex<this.objectTape[objectIndex].pollyPoints; beamIndex++)
		{
			
			beamSpeed = this.objectTape[objectIndex].extrude[beamIndex][1]*controlData[1];
			if(this.direction==0)
			{
				if(this.objectTape[objectIndex].extrude[beamIndex][2]+beamSpeed<localOuterLimit[0])
				{
					this.objectTape[objectIndex].extrude[beamIndex][2]+=beamSpeed;
				}
				else
				{
					this.objectTape[objectIndex].extrude[beamIndex][2]=localInnerLimit[0];
					this.objectTape[objectIndex].extrude[beamIndex][0] = Math.random()*360;
					this.objectTape[objectIndex].objects[beamIndex].setRotationFromEuler( new THREE.Euler( 0, 0, 0, 'XYZ' ));
					this.objectTape[objectIndex].objects[beamIndex].rotateX( this.angleToRadian(90) );
					this.objectTape[objectIndex].objects[beamIndex].rotateY( this.angleToRadian( this.objectTape[objectIndex].extrude[beamIndex][0] ) );
				}
				if(this.objectTape[objectIndex].extrude[beamIndex][3]+beamSpeed<localOuterLimit[1])
				{
					this.objectTape[objectIndex].extrude[beamIndex][3]+=beamSpeed;
				}
				else
				{
					this.objectTape[objectIndex].extrude[beamIndex][3]=localInnerLimit[1];
					this.objectTape[objectIndex].extrude[beamIndex][0] = Math.random()*360;
					this.objectTape[objectIndex].objects[beamIndex].setRotationFromEuler( new THREE.Euler( 0, 0, 0, 'XYZ' ));
					this.objectTape[objectIndex].objects[beamIndex].rotateX( this.angleToRadian(90) );
					this.objectTape[objectIndex].objects[beamIndex].rotateY( this.angleToRadian( this.objectTape[objectIndex].extrude[beamIndex][0] ) );
				}	
			}
			else
			{
				if(this.objectTape[objectIndex].extrude[beamIndex][2]-beamSpeed>localInnerLimit[0])
				{
					this.objectTape[objectIndex].extrude[beamIndex][2]-=beamSpeed;
				}
				else
				{
					this.objectTape[objectIndex].extrude[beamIndex][2]=localOuterLimit[0];
					this.objectTape[objectIndex].extrude[beamIndex][0] = Math.random()*360;
					this.objectTape[objectIndex].objects[beamIndex].setRotationFromEuler( new THREE.Euler( 0, 0, 0, 'XYZ' ));
					this.objectTape[objectIndex].objects[beamIndex].rotateX( this.angleToRadian(90) );
					this.objectTape[objectIndex].objects[beamIndex].rotateY( this.angleToRadian( this.objectTape[objectIndex].extrude[beamIndex][0] ) );
				}
				if(this.objectTape[objectIndex].extrude[beamIndex][3]-beamSpeed>localInnerLimit[1])
				{
					this.objectTape[objectIndex].extrude[beamIndex][3]-=beamSpeed;
				}
				else
				{
					this.objectTape[objectIndex].extrude[beamIndex][3]=localOuterLimit[1];
					this.objectTape[objectIndex].extrude[beamIndex][0] = Math.random()*360;
					this.objectTape[objectIndex].objects[beamIndex].setRotationFromEuler( new THREE.Euler( 0, 0, 0, 'XYZ' ));
					this.objectTape[objectIndex].objects[beamIndex].rotateX( this.angleToRadian(90) );
					this.objectTape[objectIndex].objects[beamIndex].rotateY( this.angleToRadian( this.objectTape[objectIndex].extrude[beamIndex][0] ) );
				}	
			}
			beamAngle = this.objectTape[objectIndex].extrude[beamIndex][0];
			pointPos = this.pixelMap.getElipticalPointsRaw(0, 0, this.objectTape[objectIndex].extrude[beamIndex][2]*controlData[3], this.objectTape[objectIndex].extrude[beamIndex][3]*controlData[4], beamAngle );
			this.objectTape[objectIndex].objects[beamIndex].position.set(pointPos[0], pointPos[1], 0);
			this.objectTape[objectIndex].objects[beamIndex].scale.x = controlData[2];
			this.objectTape[objectIndex].objects[beamIndex].scale.y = controlData[2];
			
		}
		
		
		this.subColourIndex += colourControls[1];
		this.colourIndex += colourControls[0];
		
		this.globalObjectGroup.rotateX( (rotationalIncrements[0])*(Math.PI/180) );
		this.globalObjectGroup.rotateY( (rotationalIncrements[1])*(Math.PI/180) );
		this.globalObjectGroup.rotateZ( (rotationalIncrements[2])*(Math.PI/180) );	
	}
	insertObject = function()
	{
		var objectIndex=0, beamIndex=0;
		var pointPos, tempLength=0, beamAngle=0;
		var localGroup = new THREE.Object3D();
		
		this.objectTape.push( new animationObject() );
		this.objectTape[objectIndex].objectID = this.groupName+this.objectIDIndex;
		this.objectTape[objectIndex].position = [this.origin[0], this.origin[1], this.origin[2]];
		this.objectTape[objectIndex].dimensions = [this.circularDimensions[0], this.circularDimensions[1], 1];
		this.objectTape[objectIndex].pollyPoints = this.numberOfBeams;

		for(beamIndex=0; beamIndex<this.objectTape[objectIndex].pollyPoints; beamIndex++)
		{
			if(this.evenDistribution==1)
			{
				beamAngle = (360/this.objectTape[objectIndex].pollyPoints)*beamIndex;
			}
			else
			{
				beamAngle = Math.random()*360;
			}
			pointPos = this.pixelMap.getElipticalPointsRaw(0, 0, this.objectTape[objectIndex].dimensions[0], this.objectTape[objectIndex].dimensions[1], beamAngle );
			tempLength = Math.random()*this.beamDimensions[2];
			this.objectTape[objectIndex].extrude.push( [beamAngle, (Math.random()*2)+0.25, this.objectTape[objectIndex].dimensions[0], this.objectTape[objectIndex].dimensions[1]] );
			this.objectTape[objectIndex].geometry.push( new THREE.BoxGeometry(this.beamDimensions[0], this.beamDimensions[1], tempLength) );
			this.objectTape[objectIndex].materials.push( new THREE.MeshLambertMaterial( {color: 0xffffff} ) );
			this.objectTape[objectIndex].materials[beamIndex].transparent = true;
			this.objectTape[objectIndex].materials[beamIndex].opacity = 1;
			//colour
			this.colourObject.getColour( Math.round((this.colourObject._bandWidth/this.objectTape[objectIndex].pollyPoints)*beamIndex)%this.colourObject._bandWidth );
			this.objectTape[objectIndex].materials[beamIndex].color.r = this.colourObject._currentColour[0]/255;
			this.objectTape[objectIndex].materials[beamIndex].color.g = this.colourObject._currentColour[1]/255;
			this.objectTape[objectIndex].materials[beamIndex].color.b = this.colourObject._currentColour[2]/255;
			this.objectTape[objectIndex].objects.push( new THREE.Mesh(this.objectTape[objectIndex].geometry[beamIndex], this.objectTape[objectIndex].materials[beamIndex]) );
			this.objectTape[objectIndex].objects[beamIndex].position.set(pointPos[0], pointPos[1], 0);
			this.objectTape[objectIndex].objects[beamIndex].rotateX( this.angleToRadian(90) );
			this.objectTape[objectIndex].objects[beamIndex].rotateY( this.angleToRadian( beamAngle ) );
			if(this.bloomEnable==1)
			{
				this.objectTape[objectIndex].objects[beamIndex].layers.enable( 1 );
			}
			//add to local group
			localGroup.add( this.objectTape[objectIndex].objects[beamIndex] );
		}
		this.objectIDIndex++;
		//finalize objects
		this.globalGroupArray.push( localGroup );
		this.globalObjectGroup.add( localGroup );
		//Finalize position
		this.globalObjectGroup.position.x =  this.origin[0];
		this.globalObjectGroup.position.y =  this.origin[1];
		this.globalObjectGroup.position.z =  this.origin[2];
		this.globalObjectGroup.rotateX( this.angleToRadian( this.rotateTo[0] ) );
		this.globalObjectGroup.rotateY( this.angleToRadian( this.rotateTo[1] ) );
		this.globalObjectGroup.rotateZ( this.angleToRadian( this.rotateTo[2] ) );
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
export default threeLazerBeems;