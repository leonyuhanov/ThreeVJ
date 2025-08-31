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

class threeExplodingPoints
{	
	constructor()
	{
		//Main object stores
		this.objectTape = new Array();
		this.globalGroupArray = new Array();
		this.globalObjectGroup = new THREE.Object3D();
		this.groupName = "EP_";
		this.objectIDIndex = 0;
		this.genObject = new animationObject();
		
		//Global Three Objects form main System
		this.scene;
		
		//Main properties
		this.origin = [0,0,0];
		this.maxRadius = 100;
		this.pollyFitness = 180;
		this.pointsPerCloud = 10;
		this.clouds = 1;
		this.pointSpeed = 1;
		this.opacity = 1;
		this.bloomEnable = 0;
		this.multiObject = 0;
		this.setUpStatus = 0;
		
		//Utility Objects
		this.pixelMap = new pixelMaper(2,2);
		this.screenRange = [100,100,100];
		this.timers = new timerObject();
		this.envelops = new envelopGenerator();
		this.lfo = new ElipticalEnvelopGenerator();
		this.directionalVectors = [1,1,1];
		this.rotateTo = [0,0,0];
		this.modify = 0;
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
	}
	animate = function(colourControls, controlData, rotationalIncrements=[0,0,0])
	{
		//controlData[0]  object scale
		//controlData[1]  width scale
		//controlData[2]  height scale
		//controlData[3]  depth scale
		//controlData[4]  particle speed
		
		if(this.setUpStatus==0){return;}
		var objectIndex=0, partIndex=0, vertIndex=0;
		var pointPosXY,pointPosYZ, localNextPoint; 
		var currentParticleSpeed;
		var vertecies, explodedStatus=0;
		
		for(objectIndex=0; objectIndex<this.objectTape.length; objectIndex++)
		{
			vertecies = new Array();
			//check if this objects points have completed explosions
			explodedStatus = this.hasExploded(objectIndex);
			if(explodedStatus==1)
			{
				//all points have expoedd to their max radius set all point statuses to 3 so they can start moving to the next random point
				this.setStatus(objectIndex, 3);
				//Generate a random point to implode to
				localNextPoint = this.genRandomPoint();
				this.objectTape[objectIndex].position[0] = localNextPoint[0];
				this.objectTape[objectIndex].position[1] = localNextPoint[1];
				this.objectTape[objectIndex].position[2] = localNextPoint[2];
				this.objectTape[objectIndex].radius = 0;
			}
			
			//implode mode
			if(this.objectTape[objectIndex].radius==0)
			{
				for(vertIndex=0; vertIndex<this.pointsPerCloud; vertIndex++)
				{
					currentParticleSpeed = ((this.pointSpeed*controlData[4])*this.objectTape[objectIndex].extrude[vertIndex][0]);
					if(this.objectTape[objectIndex].extrude[vertIndex][4]==3)
					{
						localNextPoint = this.moveTo(this.objectTape[objectIndex].pointData[vertIndex], this.objectTape[objectIndex].position, currentParticleSpeed);
						vertecies.push(new THREE.Vector3(localNextPoint[0], localNextPoint[1], localNextPoint[2]));
						this.objectTape[objectIndex].pointData[vertIndex][0] = localNextPoint[0];
						this.objectTape[objectIndex].pointData[vertIndex][1] = localNextPoint[1];
						this.objectTape[objectIndex].pointData[vertIndex][2] = localNextPoint[2];
						if( this.isSameLocation(localNextPoint, this.objectTape[objectIndex].position)==1 )
						{
							//point has reached imploded location
							this.objectTape[objectIndex].extrude[vertIndex][4]=4;
						}
					}
				}
				if(this.hasImploded(objectIndex)==1)
				{
					//object has completed imlosion
					this.objectTape[objectIndex].radius = 1;
					this.setStatus(objectIndex, 1);
					//move object to its current point
					this.objectTape[objectIndex].objects[0].position.set(this.objectTape[objectIndex].position[0],this.objectTape[objectIndex].position[1],this.objectTape[objectIndex].position[2]);
					for(vertIndex=0; vertIndex<this.pointsPerCloud; vertIndex++)
					{
						this.objectTape[objectIndex].extrude[vertIndex][3] = 0;
					}
				}
			}
			else if(this.objectTape[objectIndex].radius==1)
			{
				for(vertIndex=0; vertIndex<this.pointsPerCloud; vertIndex++)
				{
					currentParticleSpeed = ((this.pointSpeed*controlData[4])*this.objectTape[objectIndex].extrude[vertIndex][0])*this.objectTape[objectIndex].extrude[vertIndex][4];
					//Current Particles Radius in XYZ space from centre point
					if(this.objectTape[objectIndex].extrude[vertIndex][4]==1 && this.objectTape[objectIndex].extrude[vertIndex][3]+currentParticleSpeed<this.maxRadius)
					{
						//increment particles radius from centre
						this.objectTape[objectIndex].extrude[vertIndex][3]+=currentParticleSpeed;
					}
					else if(this.objectTape[objectIndex].extrude[vertIndex][4]==-1 && this.objectTape[objectIndex].extrude[vertIndex][3]+currentParticleSpeed>0)
					{
						//decrement particles radius from centre
						this.objectTape[objectIndex].extrude[vertIndex][3]+=currentParticleSpeed;
					}
					else if(this.objectTape[objectIndex].extrude[vertIndex][4]==1 && this.objectTape[objectIndex].extrude[vertIndex][3]+currentParticleSpeed>=this.maxRadius)
					{
						//particle has reached MAX radius generate next point
						this.objectTape[objectIndex].extrude[vertIndex][4]=2;
					}
					else if(this.objectTape[objectIndex].extrude[vertIndex][4]==2)
					{
						//do nothing
						vertecies.push(new THREE.Vector3(this.objectTape[objectIndex].pointData[vertIndex][0], this.objectTape[objectIndex].pointData[vertIndex][1], this.objectTape[objectIndex].pointData[vertIndex][2]));
					}
					else
					{
						//generate new XY vector
						this.objectTape[objectIndex].extrude[vertIndex][1] = Math.random()*360;
						//generate new YZ vector
						this.objectTape[objectIndex].extrude[vertIndex][2] = Math.random()*360;
						//particle has reached max radius reset to 0
						this.objectTape[objectIndex].extrude[vertIndex][3]=0;
						//particle has reached MIN radius
						this.objectTape[objectIndex].extrude[vertIndex][4]=1;
					}
					if(this.objectTape[objectIndex].extrude[vertIndex][4]==-1 || this.objectTape[objectIndex].extrude[vertIndex][4]==1)
					{
						//get XY position using radius (this.objectTape[objectIndex].extrude[vertIndex][3]) and XY vector angle (this.objectTape[objectIndex].extrude[vertIndex][1])
						pointPosXY = this.pixelMap.getElipticalPointsRaw(0, 0, this.objectTape[objectIndex].extrude[vertIndex][3], this.objectTape[objectIndex].extrude[vertIndex][3], this.objectTape[objectIndex].extrude[vertIndex][1]);
						//get YZ position using radius (this.objectTape[objectIndex].extrude[vertIndex][3]) and YZ vector angle (this.objectTape[objectIndex].extrude[vertIndex][2])
						pointPosYZ = this.pixelMap.getElipticalPointsRaw(0, 0, this.objectTape[objectIndex].extrude[vertIndex][3], this.objectTape[objectIndex].extrude[vertIndex][3], this.objectTape[objectIndex].extrude[vertIndex][2]);
						vertecies.push(new THREE.Vector3(pointPosXY[0], pointPosXY[1], pointPosYZ[1]));
						//store current location of point
						this.objectTape[objectIndex].pointData[vertIndex][0] = pointPosXY[0];
						this.objectTape[objectIndex].pointData[vertIndex][1] = pointPosXY[1];
						this.objectTape[objectIndex].pointData[vertIndex][2] = pointPosYZ[1];
					}
					/*
					else
					{
						vertecies.push(new THREE.Vector3(localNextPoint[0], localNextPoint[1], localNextPoint[2]));
						this.objectTape[objectIndex].pointData[vertIndex][0] = localNextPoint[0];
						this.objectTape[objectIndex].pointData[vertIndex][1] = localNextPoint[1];
						this.objectTape[objectIndex].pointData[vertIndex][2] = localNextPoint[2];
					}
					*/
				}
			}
			this.objectTape[objectIndex].geometry[partIndex].dispose();
			this.objectTape[objectIndex].geometry[partIndex].setFromPoints( vertecies );
			//colour
			this.colourObject.getColour( this.subColourIndex%this.colourObject._bandWidth );
			this.objectTape[objectIndex].materials[partIndex].color.r = this.colourObject._currentColour[0]/255;
			this.objectTape[objectIndex].materials[partIndex].color.g = this.colourObject._currentColour[1]/255;
			this.objectTape[objectIndex].materials[partIndex].color.b = this.colourObject._currentColour[2]/255;
			//point size
			//this.objectTape[objectIndex].materials[partIndex].size = 1+(this.objectTape[objectIndex].extrude[0][3]/this.maxRadius);
			this.subColourIndex+=colourControls[1];	
		}
		
		//global Scale
		this.globalObjectGroup.scale.set(controlData[0]*controlData[1], controlData[0]*controlData[2], controlData[0]*controlData[3]);
		//global rotation
		this.globalObjectGroup.rotateX( this.angleToRadian(rotationalIncrements[0]) );
		this.globalObjectGroup.rotateY( this.angleToRadian(rotationalIncrements[1]) );
		this.globalObjectGroup.rotateZ( this.angleToRadian(rotationalIncrements[2]) );	

		this.colourIndex += colourControls[0];
		this.subColourIndex = this.colourIndex;
	}
	isSameLocation = function(currentLocation, nextLocation)
	{
		var dataIndex=0, equalStatus=0;
		for(dataIndex=0; dataIndex<currentLocation.length; dataIndex++)
		{
			currentLocation[dataIndex] = Math.round(currentLocation[dataIndex]);
			nextLocation[dataIndex] = Math.round(nextLocation[dataIndex]);
			if(currentLocation[dataIndex]==nextLocation[dataIndex])
			{
				equalStatus++;
			}
		}
		if(equalStatus==currentLocation.length)
		{
			return 1;
		}
		return 0;
	}
	hasExploded = function(objectIndex)
	{
		var partIndex=0, exploded = 0;
		for(partIndex=0; partIndex<this.pointsPerCloud; partIndex++)
		{
			if(this.objectTape[objectIndex].extrude[partIndex][4]==2)
			{
				exploded++;
			}
		}
		if(exploded==this.pointsPerCloud)
		{
			return 1;
		}
		else
		{
			return 0;
		}
	}
	hasImploded = function(objectIndex)
	{
		var partIndex=0, imploded = 0;
		for(partIndex=0; partIndex<this.pointsPerCloud; partIndex++)
		{
			if(this.objectTape[objectIndex].extrude[partIndex][4]==4)
			{
				imploded++;
			}
		}
		if(imploded==this.pointsPerCloud)
		{
			return 1;
		}
		else
		{
			return 0;
		}
	}
	setStatus = function(objectIndex, statusID)
	{
		var partIndex=0;
		for(partIndex=0; partIndex<this.pointsPerCloud; partIndex++)
		{
			this.objectTape[objectIndex].extrude[partIndex][4]=statusID;
		}
	}
	moveTo = function(currentLocation, nextLocation, motionSpeed)
	{
		var nextPoint = [0,0,0];
		var localMotion = [0,0,0];
		var localMotionRatio = [0,0,0];
		var pointCounter=0;
		
		//work out motion direction iether 1, -1 or 0 for no motion in that plane
		for(pointCounter=0; pointCounter<3; pointCounter++)
		{
			if(nextLocation[pointCounter]>currentLocation[pointCounter])
			{
				localMotion[pointCounter]=1;
			}
			else if(nextLocation[pointCounter]<currentLocation[pointCounter])
			{
				localMotion[pointCounter]=-1;
			}
			else
			{
				localMotion[pointCounter]=0;
			}
		}
		//work out the linear smoothed motion ratio based on distance remaining
		for(pointCounter=0; pointCounter<3; pointCounter++)
		{
			if(localMotion[pointCounter]==1)
			{
				localMotionRatio[pointCounter] = nextLocation[pointCounter]-currentLocation[pointCounter];
			}
			else if(localMotion[pointCounter]==-1)
			{
				localMotionRatio[pointCounter] = currentLocation[pointCounter]-nextLocation[pointCounter];
			}
			else
			{
				localMotionRatio[pointCounter]=0;
			}
			localMotionRatio[pointCounter] = (motionSpeed/localMotionRatio[pointCounter])*localMotionRatio[pointCounter];
		}
		/*
		//move each point to he next Location
		for(pointCounter=0; pointCounter<3; pointCounter++)
		{
			if(localMotion[pointCounter]==1 && currentLocation[pointCounter]+(localMotionRatio[pointCounter]*localMotion[pointCounter])<nextLocation[pointCounter] )
			{
				nextPoint[pointCounter] = localMotionRatio[pointCounter]*motionSpeed;
			}
			else if(localMotion[pointCounter]==-1 && currentLocation[pointCounter]+(localMotionRatio[pointCounter]*localMotion[pointCounter])>nextLocation[pointCounter] )
			{
				nextPoint[pointCounter] = localMotionRatio[pointCounter]*motionSpeed;
			}
			else if(localMotion[pointCounter]==1 && currentLocation[pointCounter]+(localMotionRatio[pointCounter]*localMotion[pointCounter])>=nextLocation[pointCounter] )
			{
				nextPoint[pointCounter] = nextLocation[pointCounter];
			}
			else
			{
				nextPoint[pointCounter] = nextLocation[pointCounter];
			}
		}
		*/
		
		//move each point to he next Location
		for(pointCounter=0; pointCounter<3; pointCounter++)
		{
			if(localMotion[pointCounter]==1 && currentLocation[pointCounter]+(localMotion[pointCounter]*motionSpeed)<nextLocation[pointCounter] )
			{
				nextPoint[pointCounter] = currentLocation[pointCounter]+(localMotion[pointCounter]*motionSpeed);
			}
			else if(localMotion[pointCounter]==-1 && currentLocation[pointCounter]+(localMotion[pointCounter]*motionSpeed)>nextLocation[pointCounter] )
			{
				nextPoint[pointCounter] = currentLocation[pointCounter]+(localMotion[pointCounter]*motionSpeed);
			}
			else if(localMotion[pointCounter]==1 && currentLocation[pointCounter]+(localMotion[pointCounter]*motionSpeed)>=nextLocation[pointCounter] )
			{
				nextPoint[pointCounter] = nextLocation[pointCounter];
			}
			else
			{
				nextPoint[pointCounter] = nextLocation[pointCounter];
			}
		}
		
		return nextPoint;
	}
	genRandomPoint = function()
	{
		var nextPoint = [0,0,0];
		
		nextPoint[0] = -this.screenRange[0]+(Math.random()*(this.screenRange[0]*2));
		nextPoint[1] = this.screenRange[1]-(Math.random()*(this.screenRange[1]*2));
		nextPoint[2] = -this.screenRange[2]+(Math.random()*(this.screenRange[2]*2));
		
		return nextPoint;
	}
	insertObject = function()
	{
		var objectIndex=0, partIndex=0, vertIndex=0;
		var vertecies;
		var localGroup = new THREE.Object3D();
		
		this.subColourIndex = this.colourIndex;
		for(objectIndex=0; objectIndex<this.clouds; objectIndex++)
		{
			this.objectTape.push( new animationObject() );
			this.objectTape[objectIndex].objectID = this.groupName+this.objectIDIndex;
			this.objectTape[objectIndex].radius = 1; //set explosion mode to explode 0 to implode
			//vertex generator
			vertecies = new Array();
			for(vertIndex=0; vertIndex<this.pointsPerCloud; vertIndex++)
			{
				//particle vectors and speed
				this.objectTape[objectIndex].extrude.push( [(Math.random()*2)+0.5, Math.random()*360, Math.random()*360, 0, 1]);
				this.objectTape[objectIndex].pointData.push( [0,0,0] );	//currentpoint array
				vertecies.push( new THREE.Vector3(0, 0, 0) );
			}
			//Geometries
			this.objectTape[objectIndex].geometry.push(  new THREE.BufferGeometry().setFromPoints(  vertecies ) );
			//Material
			this.objectTape[objectIndex].materials.push( new THREE.PointsMaterial( {color: 0xffffff, map: this.sprite, transparent: true} ) );
			this.objectTape[objectIndex].materials[partIndex].transparent = true;
			this.objectTape[objectIndex].materials[partIndex].opacity = this.opacity;
			//clouds particles size
			this.objectTape[objectIndex].materials[partIndex].size = (Math.random()*2)+1;
			//colour
			this.colourObject.getColour( this.subColourIndex%this.colourObject._bandWidth );
			this.objectTape[objectIndex].materials[partIndex].color.r = this.colourObject._currentColour[0]/255;
			this.objectTape[objectIndex].materials[partIndex].color.g = this.colourObject._currentColour[1]/255;
			this.objectTape[objectIndex].materials[partIndex].color.b = this.colourObject._currentColour[2]/255;
			//Object
			this.objectTape[objectIndex].objects.push( new THREE.Points(this.objectTape[objectIndex].geometry[partIndex], this.objectTape[objectIndex].materials[partIndex]) );
			if(this.bloomEnable==1)
			{
				this.objectTape[objectIndex].objects[partIndex].layers.enable( 1 );
			}
			//add to local group
			localGroup.add( this.objectTape[objectIndex].objects[partIndex] );
			this.objectIDIndex++;
			this.subColourIndex += this.creationColourIncrement;
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
export default threeExplodingPoints;