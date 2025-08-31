import * as THREE from 'three';
import envelopGenerator from './envelopGenerator.js';					//Envelop Generator
import CCGenerator from './CCGenerator.js';								//Colour System
import timerObject from './timerObject.js';								//Timers
import pixelMaper from './pixelMaper.js';								//Pixel Maper
import animationObject from './animationObject.js';						//Generic Object Tracking class
import ElipticalEnvelopGenerator from './ElipticalEnvelopGenerator.js';

class threePrism
{	
	constructor()
	{
		//Main object stores
		this.objectTape = new Array();
		this.globalGroupArray = new Array();
		this.globalObjectGroup = new THREE.Object3D();
		this.groupName = "PRISM_";
		this.objectIDIndex = 0;
		this.genObject = new animationObject();
		
		//Global Three Objects form main System
		this.scene;
		
		//Main properties
		this.origin = [0,0,0];
		this.dimensions = [100,100,100];
		this.floorPoints = 4;
		this.pointsPerFace = 10;
		this.startAngle = 45;
		//this.defaultRotateTo = 90;
		//this.defaultPointsRotateTo = 270;
		this.rotationMatrix = [[0,0,0],[0,0,0]];
		this.lineOpacity = 1;
		this.lineOpacityStrobe = 0;
		this.lineBloom = 0;
		this.pointBloom = 0;
		this.multiObject = 0;
		this.setUpStatus = 0;
		
		//Utility Objects
		this.pixelMap = new pixelMaper(2,2);
		this.screenRange = [300,200,300];
		this.timers = new timerObject();
		this.envelops = new envelopGenerator();
		this.lfo = new ElipticalEnvelopGenerator();
		this.directionalVectors = [1,1,1];
		this.previousControlList = new Array();
		this.sprite = new THREE.TextureLoader().load( './BoilerPlate/disc.png' );
		
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
		//controlData[2] partile size scale
		//controlData[3] base scale
		//controlData[4] height scale
		
		if(this.setUpStatus==0){return;}
		var pollyIndex=0, objectIndex=0, pointPos, zPointPos, vertecies;
		var pointCloudIndex=0, pointDistance=0, pointAngle=0, faceRange = (1/this.objectTape[0].pollyPoints), tempLinePoints, shapeIndex;
		var ZPointDistance=0, ZPointAngle=0, pointSpeedIndex=0, localPointSpeed;
		var localDimensions = [(this.objectTape[objectIndex].dimensions[0]*controlData[3])*controlData[0], (this.objectTape[objectIndex].dimensions[1]*controlData[3])*controlData[0], (this.objectTape[objectIndex].dimensions[2]*controlData[4])*controlData[0]];
		
		//scale of main object outline)
		this.objectTape[objectIndex].shape[0] = new THREE.Shape();
		for(pollyIndex=0; pollyIndex<this.objectTape[objectIndex].pollyPoints; pollyIndex++)
		{
			pointPos = this.pixelMap.getElipticalPointsRaw(0, 0, localDimensions[0], localDimensions[1], ((360/this.objectTape[objectIndex].pollyPoints)*pollyIndex)+this.startAngle);
			this.objectTape[objectIndex].extrude[pollyIndex] = new THREE.Vector3( pointPos[0], pointPos[1], 0 );
			if(pollyIndex==0)
			{
				this.objectTape[objectIndex].shape[0].moveTo(this.objectTape[objectIndex].extrude[pollyIndex].x, this.objectTape[objectIndex].extrude[pollyIndex].y);
			}
			else
			{
				this.objectTape[objectIndex].shape[0].lineTo(this.objectTape[objectIndex].extrude[pollyIndex].x, this.objectTape[objectIndex].extrude[pollyIndex].y);
			}
		}
		this.objectTape[objectIndex].shape[0].lineTo(this.objectTape[objectIndex].extrude[0].x, this.objectTape[objectIndex].extrude[0].y);
		this.objectTape[objectIndex].geometry[0].dispose();
		this.objectTape[objectIndex].geometry[0].setFromPoints( this.objectTape[objectIndex].extrude );
		objectIndex++;
		for(pollyIndex=0; pollyIndex<this.objectTape[objectIndex-1].pollyPoints; pollyIndex++)
		{
			vertecies = new Array();
			vertecies.push( this.objectTape[objectIndex-1].extrude[pollyIndex] );
			vertecies.push( new THREE.Vector3( 0, 0, -localDimensions[2] ) );
			this.objectTape[objectIndex].geometry[pollyIndex].dispose()
			this.objectTape[objectIndex].geometry[pollyIndex].setFromPoints( vertecies );
		}

		//move point cloud
		for(pollyIndex=0; pollyIndex<this.objectTape[objectIndex-1].pollyPoints; pollyIndex++)
		{
			shapeIndex = faceRange*pollyIndex;
			for(pointCloudIndex=0; pointCloudIndex<this.objectTape[2].extrude[pollyIndex].length; pointCloudIndex+=3)
			{
				//x & y recalc
				pointAngle = this.pixelMap.measureAngle([this.objectTape[2].extrude[pollyIndex][pointCloudIndex], this.objectTape[2].extrude[pollyIndex][pointCloudIndex+1]], [0,0]);
				pointDistance = this.pixelMap.measureDistance([this.objectTape[2].extrude[pollyIndex][pointCloudIndex], this.objectTape[2].extrude[pollyIndex][pointCloudIndex+1]], [0,0]);
				//z recalc
				//ZPointAngle = 90;
				ZPointAngle = 0;
				//ZPointDistance = this.pixelMap.measureDistance([Math.abs(this.objectTape[2].extrude[pollyIndex][pointCloudIndex+2]), 0], [localDimensions[2], 0]);
				ZPointDistance = this.pixelMap.measureDistance([this.objectTape[2].extrude[pollyIndex][pointCloudIndex], this.objectTape[2].extrude[pollyIndex][pointCloudIndex+2]], [this.objectTape[2].extrude[pollyIndex][pointCloudIndex], localDimensions[2]]);
				localPointSpeed = this.objectTape[2].motionIncrements[pointSpeedIndex]*controlData[1];
				if(pointDistance-localPointSpeed>0 && ZPointDistance-localPointSpeed>0)
				{
					pointDistance-=localPointSpeed*controlData[3];
					ZPointDistance-=localPointSpeed*controlData[4];//(ZPointDistance/Math.abs(this.objectTape[2].extrude[pollyIndex][pointCloudIndex]));
					pointPos = this.pixelMap.getElipticalPointsRaw(0,0,pointDistance, pointDistance, pointAngle);
					zPointPos = this.pixelMap.getElipticalPointsRaw(0,0,ZPointDistance, ZPointDistance, ZPointAngle);
					this.objectTape[2].extrude[pollyIndex][pointCloudIndex] = pointPos[0];
					this.objectTape[2].extrude[pollyIndex][pointCloudIndex+1] = pointPos[1];
					//this.objectTape[2].extrude[pollyIndex][pointCloudIndex+2] = -(localDimensions[2]-zPointPos[0]);
					this.objectTape[2].extrude[pollyIndex][pointCloudIndex+2] = (localDimensions[2]-Math.abs(zPointPos[1]));
				}
				else
				{
					tempLinePoints = this.objectTape[0].shape[0].getPoint( shapeIndex+(Math.random()*faceRange)%1 );
					this.objectTape[2].extrude[pollyIndex][pointCloudIndex] = tempLinePoints.x;
					this.objectTape[2].extrude[pollyIndex][pointCloudIndex+1] = tempLinePoints.y;
					this.objectTape[2].extrude[pollyIndex][pointCloudIndex+2] = 0;
				}
				pointSpeedIndex++;
			}
			this.objectTape[2].geometry[pollyIndex].dispose();
			this.objectTape[2].geometry[pollyIndex].setAttribute( 'position', new THREE.Float32BufferAttribute( this.objectTape[2].extrude[pollyIndex] , 3 ) );
			this.objectTape[2].materials[pollyIndex].size = controlData[2];
		}
		
		this.subColourIndex += colourControls[1];
		this.colourIndex += colourControls[0];
		
		this.globalObjectGroup.rotateX( (rotationalIncrements[0])*(Math.PI/180) );
		this.globalObjectGroup.rotateY( (rotationalIncrements[1])*(Math.PI/180) );
		this.globalObjectGroup.rotateZ( (rotationalIncrements[2])*(Math.PI/180) );	
	}
	strobeOutines = function()
	{
		var pollyIndex=0;
		
		this.objectTape[0].materials[0].opacity = this.lineOpacityStrobe;
		for(pollyIndex=0; pollyIndex<this.objectTape[1].materials.length; pollyIndex++)
		{
			this.objectTape[1].materials[pollyIndex].opacity = this.lineOpacityStrobe;
		}
		
	}
	insertObject = function()
	{
		var objectIndex=0, pollyIndex, vertecies, vertexIndex, pointPos, pointCloudCount=0, cloudTempPoints=[0,0,0], ranges=[0,0], shapeIndex=0, faceRange=0, tempLinePoints;
		var localGroup = new THREE.Object3D();
		
		//insert the floor
		this.objectTape.push( new animationObject() );
		this.objectTape[objectIndex].objectID = this.groupName+this.objectIDIndex;
		this.objectTape[objectIndex].position = [this.origin[0], this.origin[1], this.origin[2]];
		this.objectTape[objectIndex].dimensions = [this.dimensions[0], this.dimensions[1], this.dimensions[2]];
		this.objectTape[objectIndex].pollyPoints = this.floorPoints;
		this.objectTape[objectIndex].subPollyPoints = this.pointsPerFace;
		this.objectTape[objectIndex].shape.push( new THREE.Shape() );
		for(pollyIndex=0; pollyIndex<this.objectTape[objectIndex].pollyPoints; pollyIndex++)
		{
			pointPos = this.pixelMap.getElipticalPointsRaw(0, 0, this.objectTape[objectIndex].dimensions[0], this.objectTape[objectIndex].dimensions[1], ((360/this.objectTape[objectIndex].pollyPoints)*pollyIndex)+this.startAngle);
			this.objectTape[objectIndex].extrude.push(new THREE.Vector3( pointPos[0], pointPos[1], 0 ));
			if(pollyIndex==0)
			{
				this.objectTape[objectIndex].shape[0].moveTo(this.objectTape[objectIndex].extrude[pollyIndex].x, this.objectTape[objectIndex].extrude[pollyIndex].y);
			}
			else
			{
				this.objectTape[objectIndex].shape[0].lineTo(this.objectTape[objectIndex].extrude[pollyIndex].x, this.objectTape[objectIndex].extrude[pollyIndex].y);
			}
		}
		this.objectTape[objectIndex].shape[0].lineTo(this.objectTape[objectIndex].extrude[0].x, this.objectTape[objectIndex].extrude[0].y);
		
		this.objectTape[objectIndex].geometry.push( new THREE.BufferGeometry().setFromPoints( this.objectTape[objectIndex].extrude ) );
		this.objectTape[objectIndex].materials.push( new THREE.LineBasicMaterial( {color: 0xffffff} ) );
		this.objectTape[objectIndex].materials[0].transparent = true;
		this.objectTape[objectIndex].materials[0].opacity = this.lineOpacity;
		this.objectTape[objectIndex].objects.push( new THREE.LineLoop(this.objectTape[objectIndex].geometry[0], this.objectTape[objectIndex].materials[0]) );
		//this.objectTape[objectIndex].objects[0].rotateX( this.angleToRadian(this.defaultRotateTo) );
		this.objectTape[objectIndex].objects[0].rotateX( this.angleToRadian(this.rotationMatrix[0][0]) );
		this.objectTape[objectIndex].objects[0].rotateY( this.angleToRadian(this.rotationMatrix[0][1]) );
		this.objectTape[objectIndex].objects[0].rotateZ( this.angleToRadian(this.rotationMatrix[0][2]) );
		if(this.lineBloom==1)
		{
			this.objectTape[objectIndex].objects[0].layers.enable( 1 );
		}
		//add to local group
		localGroup.add( this.objectTape[objectIndex].objects[0] );
		this.objectIDIndex++;
		objectIndex++;
		
		//create a line from each floor point to the centre extruded by height
		this.objectTape.push( new animationObject() );
		this.objectTape[objectIndex].objectID = this.groupName+this.objectIDIndex;
		for(pollyIndex=0; pollyIndex<this.objectTape[0].pollyPoints; pollyIndex++)
		{
			vertecies = new Array();
			vertecies.push( this.objectTape[0].extrude[pollyIndex] );
			vertecies.push( new THREE.Vector3( 0, 0, -this.objectTape[0].dimensions[2] ) );			
			this.objectTape[objectIndex].geometry.push( new THREE.BufferGeometry().setFromPoints( vertecies ) );
			this.objectTape[objectIndex].materials.push( new THREE.LineBasicMaterial( {color: 0xffffff} ) );
			this.objectTape[objectIndex].materials[pollyIndex].transparent = true;
			this.objectTape[objectIndex].materials[pollyIndex].opacity = this.lineOpacity;
			this.objectTape[objectIndex].objects.push( new THREE.Line(this.objectTape[objectIndex].geometry[pollyIndex], this.objectTape[objectIndex].materials[pollyIndex]) );
			//Initial object rotation
			//this.objectTape[objectIndex].objects[pollyIndex].rotateX( this.angleToRadian(this.defaultRotateTo) );
			this.objectTape[objectIndex].objects[pollyIndex].rotateX( this.angleToRadian(this.rotationMatrix[0][0]) );
			this.objectTape[objectIndex].objects[pollyIndex].rotateY( this.angleToRadian(this.rotationMatrix[0][1]) );
			this.objectTape[objectIndex].objects[pollyIndex].rotateZ( this.angleToRadian(this.rotationMatrix[0][2]) );
			if(this.lineBloom==1)
			{
				this.objectTape[objectIndex].objects[pollyIndex].layers.enable( 1 );
			}
			//add to local group
			localGroup.add( this.objectTape[objectIndex].objects[pollyIndex] );
		}
		this.objectIDIndex++;
		objectIndex++;
		
		//create each faces pointcloud
		this.objectTape.push( new animationObject() );
		this.objectTape[objectIndex].objectID = this.groupName+this.objectIDIndex;
		faceRange = (1/this.objectTape[0].pollyPoints);
		this.objectTape[objectIndex].motionIncrements = new Array();
		for(pollyIndex=0; pollyIndex<this.objectTape[0].pollyPoints; pollyIndex++)
		{
			shapeIndex = faceRange*pollyIndex;
			vertecies = new Array();
			for(pointCloudCount=0; pointCloudCount<this.objectTape[0].subPollyPoints; pointCloudCount++)
			{
				tempLinePoints = this.objectTape[0].shape[0].getPoint( shapeIndex+(Math.random()*faceRange)%1 );
				vertecies.push(tempLinePoints.x, tempLinePoints.y, 0);
				//particle Speed
				this.objectTape[objectIndex].motionIncrements.push(Math.random()+0.5);
			}
			this.objectTape[objectIndex].extrude.push( vertecies );
			this.objectTape[objectIndex].geometry.push( new THREE.BufferGeometry() );
			this.objectTape[objectIndex].geometry[pollyIndex].setAttribute( 'position', new THREE.Float32BufferAttribute( vertecies , 3 ) );
			this.objectTape[objectIndex].materials.push( new THREE.PointsMaterial( { color: 0xffffff, size: 1, map: this.sprite, transparent: true} ) );
			this.objectTape[objectIndex].materials[pollyIndex].transparent = true;
			this.objectTape[objectIndex].materials[pollyIndex].opacity = 1;
			//point cloud colour for this face
			this.colourObject.getColour( Math.round((this.colourObject._bandWidth/this.objectTape[0].pollyPoints)*pollyIndex)%this.colourObject._bandWidth );
			this.objectTape[objectIndex].materials[pollyIndex].color.r = this.colourObject._currentColour[0]/255;
			this.objectTape[objectIndex].materials[pollyIndex].color.g = this.colourObject._currentColour[1]/255;
			this.objectTape[objectIndex].materials[pollyIndex].color.b = this.colourObject._currentColour[2]/255;
			
			this.objectTape[objectIndex].objects.push( new THREE.Points( this.objectTape[objectIndex].geometry[pollyIndex], this.objectTape[objectIndex].materials[pollyIndex] ) );
			//this.objectTape[objectIndex].objects[pollyIndex].rotateX( this.angleToRadian(this.defaultPointsRotateTo) );
			this.objectTape[objectIndex].objects[pollyIndex].rotateX( this.angleToRadian(this.rotationMatrix[1][0]) );
			this.objectTape[objectIndex].objects[pollyIndex].rotateY( this.angleToRadian(this.rotationMatrix[1][1]) );
			this.objectTape[objectIndex].objects[pollyIndex].rotateZ( this.angleToRadian(this.rotationMatrix[1][2]) );
			if(this.pointBloom==1)
			{
				this.objectTape[objectIndex].objects[pollyIndex].layers.enable( 1 );
			}
			//add to local group
			localGroup.add( this.objectTape[objectIndex].objects[pollyIndex] );
		}
		
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
export default threePrism;