import * as THREE from 'three';
import envelopGenerator from './envelopGenerator.js';					//Envelop Generator
import CCGenerator from './CCGenerator.js';								//Colour System
import timerObject from './timerObject.js';								//Timers
import pixelMaper from './pixelMaper.js';								//Pixel Maper
import animationObject from './animationObject.js';						//Generic Object Tracking class
import ElipticalEnvelopGenerator from './ElipticalEnvelopGenerator.js';

class threeTrafficBlocks
{	
	constructor()
	{
		//Main object stores
		this.objectTape = new Array();
		this.globalGroupArray = new Array();
		this.globalObjectGroup = new THREE.Object3D();
		this.groupName = "TB_";
		this.objectIDIndex = 0;
		this.genObject = new animationObject();
		
		//Global Three Objects form main System
		this.scene;
		
		//Main properties
		this.origin = [0,0,0];
		this.gridDimenions = [300, 300];
		this.gridSpacing = [50, 10];
		this.gridSize = [20, 20];
		this.trafficDimensions = [20, 20, 1];
		this.rotateTo = [0,0,0];
		this.maxLaneSpeed = 3;
		this.direction = 1;
		this.useTexture = 0;
		this.bloomEnable = 0;
		this.bloomOnCount = 3;
		this.multiObject = 0;
		this.setUpStatus = 0;
		this.rowBoost = -1;
		this.boostBy = 5;
		
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
	triggerRowBoost = function(triggerState)
	{
		if(triggerState>0)
		{
			this.boostBy = triggerState;
			this.rowBoost = Math.round(Math.random()*this.objectTape.length);
		}
		else
		{
			this.rowBoost = -1;
		}
	}
	animate = function(colourControls, controlData, rotationalIncrements=[0,0,0])
	{
		//controlData[0] object scale
		//controlData[1] motion speed scale
		if(this.setUpStatus==0){return;}
		var rowIndex, colIndex;
		var motionSpeed;
		
		for(rowIndex=0; rowIndex<this.objectTape.length; rowIndex++)
		{
			if(rowIndex==this.rowBoost)
			{
				motionSpeed = (this.objectTape[rowIndex].extrude[0]*controlData[1])*this.boostBy;
			}
			else
			{
				motionSpeed = this.objectTape[rowIndex].extrude[0]*controlData[1];
			}
			for(colIndex=0; colIndex<this.objectTape[rowIndex].objects.length; colIndex++)
			{
				if(this.direction==1)
				{
					if(this.objectTape[rowIndex].objects[colIndex].position.x+motionSpeed<this.gridDimenions[0])
					{
						this.objectTape[rowIndex].objects[colIndex].position.x += motionSpeed;
					}
					else
					{
						this.objectTape[rowIndex].objects[colIndex].position.x = -this.gridDimenions[0];
					}
				}
				else
				{
					if(this.objectTape[rowIndex].objects[colIndex].position.x-motionSpeed>-this.gridDimenions[0])
					{
						this.objectTape[rowIndex].objects[colIndex].position.x -= motionSpeed;
					}
					else
					{
						this.objectTape[rowIndex].objects[colIndex].position.x = this.gridDimenions[0];
					}
				}
				//colour
				this.colourObject.getColour( (this.subColourIndex+(10*colIndex))%this.colourObject._bandWidth );
				this.objectTape[rowIndex].materials[colIndex].color.r = this.colourObject._currentColour[0]/255;
				this.objectTape[rowIndex].materials[colIndex].color.g = this.colourObject._currentColour[1]/255;
				this.objectTape[rowIndex].materials[colIndex].color.b = this.colourObject._currentColour[2]/255;
				//height scaler
				this.objectTape[rowIndex].objects[colIndex].position.z = this.origin[2]*controlData[2];
			}
			this.subColourIndex += colourControls[1];
		}
		
		this.colourIndex += colourControls[0];
		this.subColourIndex = this.colourIndex;
		
		this.globalObjectGroup.scale.x = controlData[0];
		this.globalObjectGroup.scale.z = controlData[0];
		
		this.globalObjectGroup.rotateX( (rotationalIncrements[0])*(Math.PI/180) );
		this.globalObjectGroup.rotateY( (rotationalIncrements[1])*(Math.PI/180) );
		this.globalObjectGroup.rotateZ( (rotationalIncrements[2])*(Math.PI/180) );	
	}
	/*
	textureMotion = function(speedScaler, colourControls)
	{
		var objectIndex=0, partIndex=0, pointIndex=0;
		var localTexture;
		
		for(partIndex=0; partIndex<this.objectTape[objectIndex].materials.length; partIndex++)
		{
			localTexture = this.objectTape[objectIndex].canvasObject[partIndex].getContext("2d");
			//localTexture.fillStyle = "rgba(0,0,0,0.01)";
			//localTexture.fillRect(0,0,this.objectTape[objectIndex].canvasObject[partIndex].width,this.objectTape[objectIndex].canvasObject[partIndex].height);
			this.colourObject.getRGBARounded( this.subColourIndex%this.colourObject._bandWidth );
			this.subColourIndex += colourControls[1];
			localTexture.fillStyle = this.colourObject._rgba;
			this.objectTape[objectIndex].extrude[partIndex][6] += Math.round(this.objectTape[objectIndex].extrude[partIndex][5]*speedScaler);
			localTexture.fillRect(this.objectTape[objectIndex].extrude[partIndex][6]%this.objectTape[objectIndex].canvasObject[partIndex].width,0,20, this.objectTape[objectIndex].canvasObject[partIndex].height);
			this.objectTape[objectIndex].texture[partIndex].needsUpdate=true;
		}
		this.colourIndex += colourControls[0];
		this.subColourIndex = this.colourIndex;
	}
	*/
	insertObject = function()
	{
		var objectIndex=0, partIndex=0, rowIndex=0, colIndex=0;
		var rowSpacing = this.gridSpacing[1], colSpacing=0;
		var rowStart = -this.gridDimenions[0], colStart = this.gridDimenions[1];
		var laneSpeed = 0;
		var trafficDims;

		var localGroup = new THREE.Object3D();
		
		for(rowIndex=0; rowIndex<this.gridSize[0]; rowIndex++)
		{
			objectIndex = rowIndex;
			this.objectTape.push( new animationObject() );
			this.objectTape[objectIndex].objectID = this.groupName+this.objectIDIndex;
			//this lanes speed
			this.objectTape[objectIndex].extrude.push( (Math.random()*this.maxLaneSpeed)+(this.maxLaneSpeed*0.05) );
			rowStart = -this.gridDimenions[0];
			for(colIndex=0; colIndex<this.gridSize[1]; colIndex++)
			{
				//size of traffic object
				trafficDims = new Array();
				trafficDims[0] = Math.round(Math.random()*this.trafficDimensions[0]);
				trafficDims[1] = Math.round(Math.random()*this.trafficDimensions[1]);//trafficDims[0];
				trafficDims[2] = this.trafficDimensions[2];
				//space from this object to the next
				colSpacing = Math.round( (Math.random()*this.gridSpacing[0])+(this.gridSpacing[0]*0.1) );
				//Object creation
				this.objectTape[objectIndex].geometry.push( new THREE.BoxGeometry(1, 1, 1, 1, 1, 1) );
				//materials
				//texture
				if(this.useTexture==1)
				{
					this.objectTape[objectIndex].canvasObject.push( document.createElement('canvas') );
					this.objectTape[objectIndex].canvasObject[colIndex].width = 100;
					this.objectTape[objectIndex].canvasObject[colIndex].height = 100;
					this.objectTape[objectIndex].canvasObject[colIndex].style.backgroundColor='rgba(0,0,0,1)';
					this.objectTape[objectIndex].canvasObject[colIndex].getContext("2d").fillStyle = 'rgba(0,0,0,1)';
					this.objectTape[objectIndex].canvasObject[colIndex].getContext("2d").fillRect(0,0,this.objectTape[objectIndex].canvasObject[colIndex].width,this.objectTape[objectIndex].canvasObject[colIndex].height);
					this.objectTape[objectIndex].texture.push( new THREE.CanvasTexture(this.objectTape[objectIndex].canvasObject[colIndex]) );
					this.objectTape[objectIndex].materials.push( new THREE.MeshLambertMaterial( {color: 0xffffff, map: this.objectTape[objectIndex].texture[colIndex]} ) );
				}
				else
				{
					this.objectTape[objectIndex].materials.push( new THREE.MeshLambertMaterial( {color: 0xffffff} ) );
				}
				this.objectTape[objectIndex].materials[colIndex].transparent = true;
				this.objectTape[objectIndex].materials[colIndex].opacity = 1;
				//colour
				this.colourObject.getColour( (this.colourIndex+(10*colIndex))%this.colourObject._bandWidth );
				this.objectTape[objectIndex].materials[colIndex].color.r = this.colourObject._currentColour[0]/255;
				this.objectTape[objectIndex].materials[colIndex].color.g = this.colourObject._currentColour[1]/255;
				this.objectTape[objectIndex].materials[colIndex].color.b = this.colourObject._currentColour[2]/255;
				//scale from trafficDims
				this.objectTape[objectIndex].objects.push( new THREE.Mesh(this.objectTape[objectIndex].geometry[colIndex], this.objectTape[objectIndex].materials[colIndex]) );
				this.objectTape[objectIndex].objects[colIndex].scale.set(trafficDims[0], trafficDims[1], trafficDims[2]);
				//position
				this.objectTape[objectIndex].objects[colIndex].position.set(rowStart, colStart, this.origin[2]);
				//bloom
				if(this.bloomEnable==1)
				{
					if(colIndex%this.bloomOnCount==this.bloomOnCount-1)
					{
						this.objectTape[objectIndex].objects[colIndex].layers.enable( 1 );
					}
				}
				//add to local group
				localGroup.add( this.objectTape[objectIndex].objects[colIndex] );
				//increment next objects start
				rowStart += trafficDims[0]+colSpacing;
				//check if next spot is beyond the alowed region
				if(rowStart>this.gridDimenions[0])
				{
					break;
				}
			}
			colStart -= (this.trafficDimensions[1]+rowSpacing);
			this.objectIDIndex++;
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
		//this.globalObjectGroup.position.z =  this.origin[2];
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
export default threeTrafficBlocks;