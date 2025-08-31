import * as THREE from 'three';
import envelopGenerator from './envelopGenerator.js';
import CCGenerator from './CCGenerator.js';

class threeParticles
{	
	constructor()
	{
		this.numberOfParticles = 0;
		this.particleCentre = [0,0,0];
		this.particleSize = 1;
		this.maxDistance = 50;
		this.particleCounter = 0;
		this.motionRange = 0;
		this.axisRange = 0;
		this.angleRange = 0;
		this.expired = 0;
		this.particleDistance = new Array();
		this.motionSpeed = new Array();
		this.particleAxis = new Array();
		this.particleAxisOffset = new Array();
		this.particleAngleOffset = new Array();
		this.material = new Array();
		this.geometry = new Array();
		this.object = new Array();
		this.envelops = new envelopGenerator();
		this.sprite = new THREE.TextureLoader().load( './BoilerPlate/disc.png' );
		//default
		this.defaultAxis = 1;
		this.globalBloom = 0;
	}
	init = function(numberOfParticles, centreLocation, particleSize, maxDecayDistance, motionRange, axisRange, angleRange, type)
	{
		var tempData;
		this.numberOfParticles = numberOfParticles;
		this.particleCentre[0] = centreLocation[0];
		this.particleCentre[1] = centreLocation[1];
		this.particleCentre[2] = centreLocation[2];
		this.particleSize = particleSize;
		this.maxDistance = maxDecayDistance;
		this.motionRange = motionRange;
		this.axisRange = axisRange;
		this.angleRange = angleRange;
		//Initiate all particle elements
		for(this.particleCounter=0; this.particleCounter<this.numberOfParticles; this.particleCounter++)
		{
			this.particleDistance.push(0);
			this.motionSpeed.push((Math.random()*motionRange)+0.001);
			this.particleAxis.push(this.defaultAxis);
			this.particleAxisOffset.push(Math.random()*axisRange);
			this.particleAngleOffset.push(Math.random()*angleRange);
			this.material.push(new THREE.MeshLambertMaterial( { color: 0xffffff, side: THREE.DoubleSide} ));
			if(type=="triangle")
			{
				tempData = this.returnTriangle([this.particleCentre[0],this.particleCentre[1],this.particleCentre[2]], this.particleSize, 0, this.material[this.particleCounter]);
				this.geometry.push(tempData[0]);
				this.object.push(tempData[1]);
			}
			else if(type=="square")
			{
				this.geometry.push( new THREE.PlaneGeometry( this.particleSize, this.particleSize ) );
				this.object.push( new THREE.Mesh( this.geometry[this.particleCounter], this.material[this.particleCounter] ) );
			}
			this.envelops.addWithTimeCode("p_"+this.particleCounter, [100,0], [200,100], 1, Math.random()*300);
		}
	}
	initPointCloud = function(numberOfParticles, centreLocation, particleSize, maxDecayDistance, motionRange, axisRange, angleRange)
	{
		var vertices  = new Array();
		var pointLocation;
		this.numberOfParticles = numberOfParticles;
		this.particleCentre[0] = centreLocation[0];
		this.particleCentre[1] = centreLocation[1];
		this.particleCentre[2] = centreLocation[2];
		this.particleSize = particleSize;
		this.maxDistance = maxDecayDistance;
		this.motionRange = motionRange;
		this.axisRange = axisRange;
		this.angleRange = angleRange;
		
		for(this.particleCounter=0; this.particleCounter<this.numberOfParticles; this.particleCounter++)
		{
			this.particleDistance.push(0);
			this.motionSpeed.push((Math.random()*motionRange)+0.00001);
			this.particleAxis.push(this.defaultAxis);
			this.particleAxisOffset.push(Math.random()*axisRange);
			this.particleAngleOffset.push(Math.random()*angleRange);
			
			pointLocation = this.get3DPointsCentered(this.particleDistance[this.particleCounter], this.particleAxisOffset[this.particleCounter], this.particleAngleOffset[this.particleCounter], this.particleCentre[0], this.particleCentre[1], this.particleCentre[2]);
			vertices.push(pointLocation[0], pointLocation[1], pointLocation[2]);
		}
		this.geometry.push( new THREE.BufferGeometry() );
		this.geometry[0].setAttribute( 'position', new THREE.Float32BufferAttribute( vertices , 3 ) );
		this.material.push( new THREE.PointsMaterial( { color: 0xffffff, size: this.particleSize, map: this.sprite, transparent: true} ) );
		this.object.push( new THREE.Points( this.geometry[0], this.material[0] ) );
		this.envelops.addWithTimeCode("pointCloudEnvelop", [100,0], [200,100], 1, Math.random()*300);
	}
	initPointObjects = function(numberOfParticles, centreLocation, particleSize, maxDecayDistance, motionRange, axisRange, angleRange)
	{
		var vertices;
		var pointLocation;
		this.numberOfParticles = numberOfParticles;
		this.particleCentre[0] = centreLocation[0];
		this.particleCentre[1] = centreLocation[1];
		this.particleCentre[2] = centreLocation[2];
		this.particleSize = particleSize;
		this.maxDistance = maxDecayDistance;
		this.motionRange = motionRange;
		this.axisRange = axisRange;
		this.angleRange = angleRange;
		
		for(this.particleCounter=0; this.particleCounter<this.numberOfParticles; this.particleCounter++)
		{
			this.particleDistance.push(0);
			this.motionSpeed.push((Math.random()*motionRange)+0.00001);
			this.particleAxis.push(this.defaultAxis);
			this.particleAxisOffset.push(Math.random()*axisRange);
			this.particleAngleOffset.push(Math.random()*angleRange);
			
			pointLocation = this.get3DPointsCentered(this.particleDistance[this.particleCounter], this.particleAxisOffset[this.particleCounter], this.particleAngleOffset[this.particleCounter], this.particleCentre[0], this.particleCentre[1], this.particleCentre[2]);
			vertices  = new Array();
			vertices.push(pointLocation[0], pointLocation[1], pointLocation[2]);
			this.geometry.push( new THREE.BufferGeometry() );
			this.geometry[this.particleCounter].setAttribute( 'position', new THREE.Float32BufferAttribute( vertices , 3 ) );
			this.material.push( new THREE.PointsMaterial( { color: 0xffffff, size: this.particleSize, map: this.sprite, transparent: true} ) );
			this.object.push( new THREE.Points( this.geometry[this.particleCounter], this.material[this.particleCounter] ) );
		}	
		this.envelops.addWithTimeCode("pointObjectEnvelop", [100,0], [200,100], 1, Math.random()*300);
	}
	addToScene = function(scene, type)
	{
		if(type=="pointcloud")
		{
			if(this.globalBloom==1)
			{
				this.object[0].layers.enable( 1 );
			}
			scene.add(this.object[0]);
		}
		else if(type=="pointobject")
		{
			for(this.particleCounter=0; this.particleCounter<this.numberOfParticles; this.particleCounter++)
			{
				scene.add( this.object[this.particleCounter] );	
			}
		}
		else
		{
			for(this.particleCounter=0; this.particleCounter<this.numberOfParticles; this.particleCounter++)
			{
				scene.add( this.object[this.particleCounter] );	
			}
		}
	}
	cleanUp = function(scene, type)
	{
		if(type=="pointcloud")
		{
			scene.remove(this.object[0]);
			this.geometry[0].dispose();
			this.material[0].dispose();
			this.envelops.remove("pointCloudEnvelop");
		}
		else if(type=="pointobject")
		{
			for(this.particleCounter=0; this.particleCounter<this.numberOfParticles; this.particleCounter++)
			{
				scene.remove(this.object[this.particleCounter]);
				this.geometry[this.particleCounter].dispose();
				this.material[this.particleCounter].dispose();
			}
			this.envelops.remove("pointObjectEnvelop");
		}
		else
		{
			for(this.particleCounter=0; this.particleCounter<this.numberOfParticles; this.particleCounter++)
			{
				scene.remove(this.object[this.particleCounter]);
				this.geometry[this.particleCounter].dispose();
				this.material[this.particleCounter].dispose();
				this.envelops.remove("p_"+this.particleCounter);
			}
		}
		this.particleDistance = new Array();
		this.motionSpeed = new Array();
		this.particleAxis = new Array();
		this.particleAxisOffset = new Array();
		this.particleAngleOffset = new Array();
		this.material = new Array();
		this.geometry = new Array();
		this.object = new Array();
		
	}
	motion = function(parentRadius, radiusScaler, particleScaler, colourIndex, colourIncrement, colourObject)
	{
		var particleAxis, localAngleFromAxis, particleAngle,currentParticleRadius,maxParticleRadius,particleIncrement;
		var particlePosition = [0,0,0];
		
		for(this.particleCounter=0; this.particleCounter<this.numberOfParticles; this.particleCounter++)
		{
			particleAxis = this.particleAxis[this.particleCounter];
			localAngleFromAxis = this.particleAxisOffset[this.particleCounter];
			particleAngle = this.particleAngleOffset[this.particleCounter];
			currentParticleRadius = this.particleDistance[this.particleCounter]+((parentRadius)*(radiusScaler+1));
			maxParticleRadius = this.maxDistance*(radiusScaler+1);
			particleIncrement = this.motionSpeed[this.particleCounter];
			if(currentParticleRadius+particleIncrement<maxParticleRadius)
			{
				currentParticleRadius+=particleIncrement;
				this.particleDistance[this.particleCounter] = currentParticleRadius;
			}
			else
			{
				currentParticleRadius=0;
				particleAxis = this.defaultAxis;
				localAngleFromAxis = Math.random()*this.axisRange;
				particleAngle = Math.random()*this.angleRange;
				particleIncrement = (Math.random()*this.motionRange)+0.001;
				//set back into object
				this.particleAxis[this.particleCounter] = particleAxis;
				this.particleAxisOffset[this.particleCounter] = localAngleFromAxis;
				this.particleAngleOffset[this.particleCounter]  = particleAngle;
				this.particleDistance[this.particleCounter] = currentParticleRadius;
				this.motionSpeed[this.particleCounter] = particleIncrement;
			}
			particlePosition = this.get3DPointsCentered(currentParticleRadius, localAngleFromAxis, particleAngle, this.particleCentre[0], this.particleCentre[1], this.particleCentre[2]);
			this.remapAxisPoints(particleAxis, particlePosition);
			this.object[this.particleCounter].position.x = particlePosition[0];
			this.object[this.particleCounter].position.y = particlePosition[1];
			this.object[this.particleCounter].position.z = particlePosition[2];
			//Opacity
			this.material[this.particleCounter].opacity = 1-(currentParticleRadius/maxParticleRadius);
			//Colour
			colourObject.getColour(colourIndex%colourObject._bandWidth);
			this.material[this.particleCounter].color.r = colourObject._currentColour[0]/255;
			this.material[this.particleCounter].color.g = colourObject._currentColour[1]/255;
			this.material[this.particleCounter].color.b = colourObject._currentColour[2]/255;	
			//scale
			this.object[this.particleCounter].scale.x = ((particleScaler+1)-((currentParticleRadius/maxParticleRadius)*(radiusScaler+1)));
			this.object[this.particleCounter].scale.y = this.object[this.particleCounter].scale.x;
			this.object[this.particleCounter].scale.z = this.object[this.particleCounter].scale.x;
			colourIndex += colourIncrement;
		}
		return colourIndex;
	}
	motionPointCloud = function(parentRadius, radiusScaler, particleSize, colourIndex, colourIncrement, colourObject, particleSpeed=0)
	{
		var particleAxis, localAngleFromAxis, particleAngle,currentParticleRadius,maxParticleRadius,particleIncrement;
		var particlePosition = [0,0,0];
		var vertices  = new Array()
		
		for(this.particleCounter=0; this.particleCounter<this.numberOfParticles; this.particleCounter++)
		{
			particleAxis = this.particleAxis[this.particleCounter];
			localAngleFromAxis = this.particleAxisOffset[this.particleCounter];
			particleAngle = this.particleAngleOffset[this.particleCounter];
			currentParticleRadius = this.particleDistance[this.particleCounter];//+((parentRadius)*(radiusScaler+1));
			maxParticleRadius = this.maxDistance+((parentRadius)*(radiusScaler+1));
			particleIncrement = this.motionSpeed[this.particleCounter]+particleSpeed;
			if(currentParticleRadius+particleIncrement<maxParticleRadius)
			{
				currentParticleRadius+=particleIncrement;
				this.particleDistance[this.particleCounter] = currentParticleRadius;
			}
			else
			{
				currentParticleRadius=((parentRadius)*(radiusScaler+1));
				particleAxis = this.defaultAxis;
				localAngleFromAxis = Math.random()*this.axisRange;
				particleAngle = Math.random()*this.angleRange;
				particleIncrement = (Math.random()*this.motionRange)+0.00001;
				//set back into object
				this.particleAxis[this.particleCounter] = particleAxis;
				this.particleAxisOffset[this.particleCounter] = localAngleFromAxis;
				this.particleAngleOffset[this.particleCounter]  = particleAngle;
				this.particleDistance[this.particleCounter] = currentParticleRadius;
				this.motionSpeed[this.particleCounter] = particleIncrement;
			}
			particlePosition = this.get3DPointsCentered(currentParticleRadius, localAngleFromAxis, particleAngle, this.particleCentre[0], this.particleCentre[1], this.particleCentre[2]);
			this.remapAxisPoints(particleAxis, particlePosition);
			vertices.push(particlePosition[0], particlePosition[1], particlePosition[2])
		}
		//set up new point cloud
		this.geometry[0].dispose();
		this.geometry[0].setAttribute( 'position', new THREE.Float32BufferAttribute( vertices , 3 ) );
		//Colour for entire point cloud
		colourObject.getColour(colourIndex%colourObject._bandWidth);
		this.material[0].color.r = colourObject._currentColour[0]/255;
		this.material[0].color.g = colourObject._currentColour[1]/255;
		this.material[0].color.b = colourObject._currentColour[2]/255;
		//particle Size
		this.material[0].size = particleSize;
		colourIndex += colourIncrement;
		return colourIndex;
	}
	motionPointCloudAngular = function(parentRadius, radiusScaler, particleSize, colourIndex, colourIncrement, colourObject, particleSpeed, axisAngle, offsetAngle)
	{
		var particleAxis, localAngleFromAxis, particleAngle,currentParticleRadius,maxParticleRadius,particleIncrement;
		var particlePosition = [0,0,0];
		var vertices  = new Array()
		
		for(this.particleCounter=0; this.particleCounter<this.numberOfParticles; this.particleCounter++)
		{
			particleAxis = this.particleAxis[this.particleCounter];
			localAngleFromAxis = this.particleAxisOffset[this.particleCounter];
			particleAngle = this.particleAngleOffset[this.particleCounter];
			currentParticleRadius = this.particleDistance[this.particleCounter];
			maxParticleRadius = this.maxDistance+((parentRadius)*(radiusScaler+1));
			particleIncrement = this.motionSpeed[this.particleCounter]+particleSpeed;
			if(currentParticleRadius+particleIncrement<maxParticleRadius)
			{
				currentParticleRadius+=particleIncrement;
				this.particleDistance[this.particleCounter] = currentParticleRadius;
			}
			else
			{
				currentParticleRadius=((parentRadius)*(radiusScaler+1));
				particleAxis = this.defaultAxis;
				localAngleFromAxis = ((this.axisRange - (axisAngle/2))+(Math.random()*axisAngle))%360;
				particleAngle = ((this.angleRange - (offsetAngle/2))+(Math.random()*offsetAngle))%360;
				particleIncrement = (Math.random()*this.motionRange)+0.00001;
				//set back into object
				this.particleAxis[this.particleCounter] = particleAxis;
				this.particleAxisOffset[this.particleCounter] = localAngleFromAxis;
				this.particleAngleOffset[this.particleCounter]  = particleAngle;
				this.particleDistance[this.particleCounter] = currentParticleRadius;
				this.motionSpeed[this.particleCounter] = particleIncrement;
			}
			particlePosition = this.get3DPointsCentered(currentParticleRadius, localAngleFromAxis, particleAngle, this.particleCentre[0], this.particleCentre[1], this.particleCentre[2]);
			this.remapAxisPoints(particleAxis, particlePosition);
			vertices.push(particlePosition[0], particlePosition[1], particlePosition[2])
		}
		//set up new point cloud
		this.geometry[0].dispose();
		this.geometry[0].setAttribute( 'position', new THREE.Float32BufferAttribute( vertices , 3 ) );
		//Colour for entire point cloud
		colourObject.getColour(colourIndex%colourObject._bandWidth);
		this.material[0].color.r = colourObject._currentColour[0]/255;
		this.material[0].color.g = colourObject._currentColour[1]/255;
		this.material[0].color.b = colourObject._currentColour[2]/255;
		//particle Size
		this.material[0].size = particleSize;
		colourIndex += colourIncrement;
		return colourIndex;
	}
	motionPointCloudAdvanced = function(parentRadius, radiusScaler, particleSize, colourIndex, colourIncrement, colourObject, particleSpeed=0)
	{
		var particleAxis, localAngleFromAxis, particleAngle,currentParticleRadius,maxParticleRadius,particleIncrement;
		var particlePosition = [0,0,0];
		var vertices  = new Array()
		
		for(this.particleCounter=0; this.particleCounter<this.numberOfParticles; this.particleCounter++)
		{
			particleAxis = this.particleAxis[this.particleCounter];
			localAngleFromAxis = this.particleAxisOffset[this.particleCounter];
			particleAngle = this.particleAngleOffset[this.particleCounter];
			currentParticleRadius = this.particleDistance[this.particleCounter];//+((parentRadius)*(radiusScaler+1));
			maxParticleRadius = this.maxDistance+((parentRadius)*(radiusScaler+1));
			particleIncrement = this.motionSpeed[this.particleCounter]+particleSpeed;
			if(currentParticleRadius+particleIncrement<maxParticleRadius)
			{
				currentParticleRadius+=particleIncrement;
				this.particleDistance[this.particleCounter] = currentParticleRadius;
			}
			else
			{
				/*
				currentParticleRadius=((parentRadius)*(radiusScaler+1));
				particleAxis = this.defaultAxis;
				localAngleFromAxis = Math.random()*this.axisRange;
				particleAngle = Math.random()*this.angleRange;
				particleIncrement = (Math.random()*this.motionRange)+0.00001;
				//set back into object
				this.particleAxis[this.particleCounter] = particleAxis;
				this.particleAxisOffset[this.particleCounter] = localAngleFromAxis;
				this.particleAngleOffset[this.particleCounter]  = particleAngle;
				this.particleDistance[this.particleCounter] = currentParticleRadius;
				this.motionSpeed[this.particleCounter] = particleIncrement;
				*/
				this.expired++;
			}
			particlePosition = this.get3DPointsCentered(currentParticleRadius, localAngleFromAxis, particleAngle, this.particleCentre[0], this.particleCentre[1], this.particleCentre[2]);
			this.remapAxisPoints(particleAxis, particlePosition);
			vertices.push(particlePosition[0], particlePosition[1], particlePosition[2])
		}
		//set up new point cloud
		this.geometry[0].dispose();
		this.geometry[0].setAttribute( 'position', new THREE.Float32BufferAttribute( vertices , 3 ) );
		//Colour for entire point cloud
		colourObject.getColour(colourIndex%colourObject._bandWidth);
		this.material[0].color.r = colourObject._currentColour[0]/255;
		this.material[0].color.g = colourObject._currentColour[1]/255;
		this.material[0].color.b = colourObject._currentColour[2]/255;
		//particle Size
		this.material[0].size = particleSize;
		colourIndex += colourIncrement;
		return colourIndex;
	}
	motionPointObject = function(parentRadius, radiusScaler, particleScaler, colourIndex, colourIncrement, colourObject)
	{
		var particleAxis, localAngleFromAxis, particleAngle,currentParticleRadius,maxParticleRadius,particleIncrement;
		var particlePosition = [0,0,0];
		
		for(this.particleCounter=0; this.particleCounter<this.numberOfParticles; this.particleCounter++)
		{
			particleAxis = this.particleAxis[this.particleCounter];
			localAngleFromAxis = this.particleAxisOffset[this.particleCounter];
			particleAngle = this.particleAngleOffset[this.particleCounter];
			currentParticleRadius = this.particleDistance[this.particleCounter]+((parentRadius)*(radiusScaler+1));
			maxParticleRadius = this.maxDistance*(radiusScaler+1);
			particleIncrement = this.motionSpeed[this.particleCounter];
			if(currentParticleRadius+particleIncrement<maxParticleRadius)
			{
				currentParticleRadius+=particleIncrement;
				this.particleDistance[this.particleCounter] = currentParticleRadius;
			}
			else
			{
				currentParticleRadius=0;
				particleAxis = this.defaultAxis;
				localAngleFromAxis = Math.random()*this.axisRange;
				particleAngle = Math.random()*this.angleRange;
				particleIncrement = (Math.random()*this.motionRange)+0.00001;
				//set back into object
				this.particleAxis[this.particleCounter] = particleAxis;
				this.particleAxisOffset[this.particleCounter] = localAngleFromAxis;
				this.particleAngleOffset[this.particleCounter]  = particleAngle;
				this.particleDistance[this.particleCounter] = currentParticleRadius;
				this.motionSpeed[this.particleCounter] = particleIncrement;
			}
			particlePosition = this.get3DPointsCentered(currentParticleRadius, localAngleFromAxis, particleAngle, this.particleCentre[0], this.particleCentre[1], this.particleCentre[2]);
			this.remapAxisPoints(particleAxis, particlePosition);
			//set up new point cloud
			this.geometry[this.particleCounter].setAttribute( 'position', new THREE.Float32BufferAttribute( particlePosition , 3 ) );
			//Opacity
			this.material[this.particleCounter].opacity = 1-(currentParticleRadius/maxParticleRadius);
			//Colour
			colourObject.getColour(colourIndex%colourObject._bandWidth);
			this.material[this.particleCounter].color.r = colourObject._currentColour[0]/255;
			this.material[this.particleCounter].color.g = colourObject._currentColour[1]/255;
			this.material[this.particleCounter].color.b = colourObject._currentColour[2]/255;	
			//particle size
			this.material[this.particleCounter].size = ((particleScaler+1)-((currentParticleRadius/maxParticleRadius)*(radiusScaler+1)));
			colourIndex += colourIncrement;
		}
		return colourIndex;
	}
	
	returnTriangle = function(positionArray, size, rotationOffset, material)
	{
		var geometry = new THREE.BufferGeometry();
		var returnObject;
		var pointArray = new Array(), normals = new Array();
		var objectPositionArray = [0,0];
		var pointCounter=0, numberOfPoints=3;
		var nx, ny, nz;
		
		var pA = new THREE.Vector3();
		var pB = new THREE.Vector3();
		var pC = new THREE.Vector3();
		var cb = new THREE.Vector3();
		var ab = new THREE.Vector3();
		
		//create a triangle around a centre point using a radius
		for(pointCounter=0; pointCounter<numberOfPoints; pointCounter++)
		{
			objectPositionArray = this.getCircularPointsRaw(positionArray[0], positionArray[1], size, ((360/numberOfPoints)*pointCounter)+rotationOffset);
			pointArray.push( objectPositionArray[0], objectPositionArray[1], 0 );
			
		}
		// flat face normals
		pA.set( pointArray[0], pointArray[1], pointArray[2] );
		pB.set( pointArray[3], pointArray[4], pointArray[5] );
		pC.set( pointArray[6], pointArray[7], pointArray[8] );
		cb.subVectors( pC, pB );
		ab.subVectors( pA, pB );
		cb.cross( ab );
		cb.normalize();
		nx = cb.x;
		ny = cb.y;
		nz = cb.z;
		normals.push( nx, ny, nz );
		normals.push( nx, ny, nz );
		normals.push( nx, ny, nz );
		//No idea what this does
		function disposeArray()
		{
			this.array = null;
		}
		geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( pointArray, 3 ).onUpload( disposeArray ) );
		geometry.setAttribute( 'normal', new THREE.Float32BufferAttribute( normals, 3 ).onUpload( disposeArray ) );
		geometry.computeBoundingSphere();
		returnObject = new THREE.Mesh( geometry, material );
		return [geometry,returnObject];
		
	}
	getCircularPointsRaw = function(circleX, circleY, circleR, angleFromTopLeftoRight)
	{
		var circCoOrds = [0, 0];
		circCoOrds[0] = circleX + Math.sin(angleFromTopLeftoRight*(Math.PI / 180))*circleR ;
		circCoOrds[1] = circleY - Math.cos(angleFromTopLeftoRight*(Math.PI / 180))*circleR;
		return circCoOrds;
	}
	get3DPointsCentered = function (radius, angleFromTopLeftoRight, angleOffAxis, cX, cY, cZ)
	{
		var points3D = [0,0,0];
		points3D[0] = radius * Math.cos(angleFromTopLeftoRight*(Math.PI/180)) * Math.sin(angleOffAxis*(Math.PI/180));
		points3D[1] = radius * Math.sin(angleFromTopLeftoRight*(Math.PI/180)) * Math.sin(angleOffAxis*(Math.PI/180));
		points3D[2] = radius * Math.cos(angleOffAxis*(Math.PI/180));
		points3D[0] = cX+points3D[0];
		points3D[1] = cY+points3D[1];
		points3D[2] = cZ+points3D[2];
		return points3D;
	}
	remapAxisPoints = function (axis, points3D)
	{
		var remapedPoints = [0,0,0];
		
		if(axis==0)
		{
			remapedPoints[0] = points3D[0];
			remapedPoints[1] = points3D[1];
			remapedPoints[2] = points3D[2];
		}
		else if(axis==1)
		{
			remapedPoints[0] = points3D[0];
			remapedPoints[1] = points3D[2];
			remapedPoints[2] = points3D[1];
		}
		else if(axis==2)
		{
			remapedPoints[0] = points3D[2];
			remapedPoints[1] = points3D[1];
			remapedPoints[2] = points3D[0];
		}
		return remapedPoints;
	}
}
export default threeParticles;