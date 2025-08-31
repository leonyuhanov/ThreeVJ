import * as THREE from 'three';
import envelopGenerator from './envelopGenerator.js';					//Envelop Generator
import CCGenerator from './CCGenerator.js';								//Colour System
import timerObject from './timerObject.js';								//Timers
import pixelMaper from './pixelMaper.js';								//Pixel Maper
import animationObject from './animationObject.js';						//Generic Object Tracking class
import ElipticalEnvelopGenerator from './ElipticalEnvelopGenerator.js';

class threePulseTube
{	
	constructor()
	{
		//Main object stores
		this.objectTape = new Array();
		this.globalGroupArray = new Array();
		this.globalObjectGroup = new THREE.Object3D();
		this.groupName = "PT_";
		this.objectIDIndex = 0;
		this.genObject = new animationObject();
		
		//Global Three Objects form main System
		this.scene;
		
		//Main properties
		this.origin = [0,0,0];
		this.dimensions = [100, 100, 300];
		this.layerCount = 1;
		this.pulsesPerLayer = 10;
		this.pulsePollyFiness = 64;
		this.layerSubtractor = 0.025;
		this.lineONOpacity = 1;
		this.lineOFFOpacity = 0.1;
		this.lfoSeed = 0;
		this.angleSeed = 0;
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
		this.rotateTo = [0,0,0];
		//this.previousControls = [1,1,1];
		
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
		//controlData[1] path width scale
		//controlData[2] path height scale
		//controlData[3] path depth scale
		//controlData[4] pulse z motion
		//controlData[5] pulse opacity motion
		
		if(this.setUpStatus==0){return;}
		var objectIndex=0, partIndex=0, zIndex=0, opacityMotion=0;
		
		for(objectIndex=0; objectIndex<this.objectTape.length; objectIndex++)
		{
			//pulse opacity motion
			this.objectTape[objectIndex].extrudeDepth = (this.objectTape[objectIndex].extrudeDepth+controlData[5])%this.pulsesPerLayer;
			/*
			if(this.objectTape[objectIndex].motionIncrements[0]==1)
			{
				if(this.objectTape[objectIndex].extrudeDepth+controlData[5]>this.pulsesPerLayer)
				{
					this.objectTape[objectIndex].extrudeDepth=0;
				}
				else
				{
					this.objectTape[objectIndex].extrudeDepth+=controlData[5];
				}
			}
			else
			{
				if(this.objectTape[objectIndex].extrudeDepth-controlData[5]<0)
				{
					this.objectTape[objectIndex].extrudeDepth=this.pulsesPerLayer-1;
				}
				else
				{
					this.objectTape[objectIndex].extrudeDepth-=controlData[5];
				}
			}
			*/
			for(partIndex=0; partIndex<this.pulsesPerLayer; partIndex++)
			{
				//pulse motion
				opacityMotion = +this.objectTape[objectIndex].extrude[0][1]*controlData[4];
				if(this.objectTape[objectIndex].extrude[partIndex][0]+opacityMotion>=this.screenRange[2]/2)
				{
					this.objectTape[objectIndex].extrude[partIndex][0] = -(this.screenRange[2]/2);
				}
				else
				{
					this.objectTape[objectIndex].extrude[partIndex][0] += opacityMotion;
				}
				
				this.objectTape[objectIndex].objects[partIndex].position.z = this.objectTape[objectIndex].extrude[partIndex][0];
				//pulse opacity motion
				if(partIndex==Math.round(this.objectTape[objectIndex].extrudeDepth))
				{
					this.objectTape[objectIndex].materials[partIndex].opacity = this.lineONOpacity;
					this.objectTape[objectIndex].objects[partIndex].layers.enable( 1 );
					//this.objectTape[objectIndex].objects[partIndex].visible = true;
				}
				else
				{
					this.objectTape[objectIndex].materials[partIndex].opacity = this.lineOFFOpacity;
					this.objectTape[objectIndex].objects[partIndex].layers.disable( 1 );
					//this.objectTape[objectIndex].objects[partIndex].visible = false;

				}
			}
		}
		
		//scale
		this.globalObjectGroup.scale.set(controlData[0]*controlData[1], controlData[0]*controlData[2], controlData[0]*controlData[3]);
		
		this.globalObjectGroup.rotateX( (rotationalIncrements[0])*(Math.PI/180) );
		this.globalObjectGroup.rotateY( (rotationalIncrements[1])*(Math.PI/180) );
		this.globalObjectGroup.rotateZ( (rotationalIncrements[2])*(Math.PI/180) );	

		this.colourIndex += colourControls[0];
		this.subColourIndex = this.colourIndex;

	}
	insertObject = function()
	{
		var objectIndex=0, partIndex=0, zIndex=0;
		var localDims = [0,0]
		var localGroup = new THREE.Object3D();
		
		this.subColourIndex = this.colourIndex;
		for(objectIndex=0; objectIndex<this.layerCount; objectIndex++)
		{
			this.objectTape.push( new animationObject() );
			this.objectTape[objectIndex].objectID = this.groupName+this.objectIDIndex;
			this.objectTape[objectIndex].extrudeDepth = Math.round((Math.random()*this.pulsesPerLayer)); //opacity on index
			this.generatedirectionalVectors();
			//this.objectTape[objectIndex].motionIncrements = [this.directionalVectors[0], this.directionalVectors[1], this.directionalVectors[2]]; 
			this.objectTape[objectIndex].motionIncrements = [1, 1, 1]; 
			localDims[0] = this.dimensions[0]-(this.dimensions[0]*(this.layerSubtractor*objectIndex));
			localDims[1] = this.dimensions[1]-(this.dimensions[1]*(this.layerSubtractor*objectIndex));
			for(partIndex=0; partIndex<this.pulsesPerLayer; partIndex++)
			{
				zIndex = -(this.dimensions[2]/2)+((this.dimensions[2]/this.pulsesPerLayer)*partIndex);
				this.objectTape[objectIndex].extrude.push([zIndex, (Math.random()*0.5)+0.001]);
				//create the Polly shape
				this.objectTape[objectIndex].shape.push( new THREE.EllipseCurve(0, 0, localDims[1], localDims[1], 0,  2 * Math.PI, false, 0) );
				this.objectTape[objectIndex].geometry.push( new THREE.BufferGeometry().setFromPoints(  this.objectTape[objectIndex].shape[0].getPoints( this.pulsePollyFiness ) ) );
				this.objectTape[objectIndex].materials.push( new THREE.LineBasicMaterial( {color: 0xffffff} ) );
				this.objectTape[objectIndex].materials[partIndex].transparent = true;
				if(this.objectTape[objectIndex].extrudeDepth==partIndex)
				{
					this.objectTape[objectIndex].materials[partIndex].opacity = this.lineONOpacity;
				}
				else
				{
					this.objectTape[objectIndex].materials[partIndex].opacity = this.lineOFFOpacity;
				}
				//colour
				this.colourObject.getColour( this.subColourIndex%this.colourObject._bandWidth );
				this.objectTape[objectIndex].materials[partIndex].color.r = this.colourObject._currentColour[0]/255;
				this.objectTape[objectIndex].materials[partIndex].color.g = this.colourObject._currentColour[1]/255;
				this.objectTape[objectIndex].materials[partIndex].color.b = this.colourObject._currentColour[2]/255;
				this.objectTape[objectIndex].objects.push( new THREE.Line(this.objectTape[objectIndex].geometry[partIndex], this.objectTape[objectIndex].materials[partIndex]) );
				this.objectTape[objectIndex].objects[partIndex].layers.enable( 1 );
				this.objectTape[objectIndex].objects[partIndex].position.z = zIndex;
				localGroup.add( this.objectTape[objectIndex].objects[partIndex] );
			}
			this.objectIDIndex++;
			this.subColourIndex+=20;
		}		
		
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
export default threePulseTube;