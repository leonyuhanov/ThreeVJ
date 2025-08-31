import * as THREE from 'three';

class CameraSequencer
{	
	constructor()
	{
		this.keyFrames = new Array();
		this.motionSpeed = [0,0,0];
		this.currentFrame = 0;
		this.completed = 0;
		this.positionalCutOff = 0.0001;
		this.cameraPathCurve;
		this.pathFiness = 720;
		this.cameraPosition = new THREE.Vector3(0,0,0);
		
	}
	addPoints = function(point_Vector3)
	{
		this.keyFrames.push( new THREE.Vector3(point_Vector3.x, point_Vector3.y, point_Vector3.z) );
	}
	setMotionSpeed = function(x, y, z)
	{
		this.motionSpeed = [x, y, z];
	}
	clear = function()
	{
		this.keyFrames = new Array();
	}
	/*
	go = function(camera)
	{
		this.cameraPosition = this.cameraPathCurve.getPointAt( (this.currentFrame/this.pathFiness)%1 );
		camera.position.set(this.cameraPosition.x, this.cameraPosition.y, this.cameraPosition.z);
		this.currentFrame += this.motionSpeed[0];
		if(this.currentFrame>=this.pathFiness)
		{
			this.completed=1;
		}
		//camPosition = animSys.getGlobalVar("cameraCurve").getPointAt( ((currentCameraIndex+1)/animSys.getGlobalVar("cameraFiness"))%1 );
		//controls.target = camPosition;
		//camera.up = new THREE.Vector3(0,0,1);
	}
	*/
	go = function(camera)
	{
		if(this.completed==1)
		{
			return;
		}
		var directionArray = this.getDirection(camera.position, this.keyFrames[ this.currentFrame ]);
		//Check if cuurent sequence has completed			
		if( directionArray[0]==0 && directionArray[1]==0 && directionArray[2]==0 )
		{
			if(this.currentFrame+1<this.keyFrames.length)
			{
				this.currentFrame++;
				return;
			}
			else
			{
				this.currentFrame=0;
				this.completed=1;
				return;
			}
		}
		//Move X
		if(directionArray[0]!=0)
		{
			if(directionArray[0]==1 && ((camera.position.x+(this.motionSpeed[0]*directionArray[0]))>=this.keyFrames[this.currentFrame].x))
			{
				camera.position.x = this.keyFrames[this.currentFrame].x;
			}
			else if(directionArray[0]==-1 && ((camera.position.x+(this.motionSpeed[0]*directionArray[0]))<=this.keyFrames[this.currentFrame].x))
			{
				camera.position.x = this.keyFrames[this.currentFrame].x;
			}
			else
			{
				camera.position.x += (this.motionSpeed[0]*directionArray[0]);
			}
		}
		//Move Y
		if(directionArray[1]!=0)
		{
			if(directionArray[1]==1 && ((camera.position.y+(this.motionSpeed[1]*directionArray[1]))>=this.keyFrames[this.currentFrame].y))
			{
				camera.position.y = this.keyFrames[this.currentFrame].y;
			}
			else if(directionArray[1]==-1 && ((camera.position.y+(this.motionSpeed[1]*directionArray[1]))<=this.keyFrames[this.currentFrame].y))
			{
				camera.position.y = this.keyFrames[this.currentFrame].y;
			}
			else
			{
				camera.position.y += (this.motionSpeed[1]*directionArray[1]);
			}
		}
		//Move Z
		if(directionArray[2]!=0)
		{
			if(directionArray[2]==1 && ((camera.position.z+(this.motionSpeed[2]*directionArray[2]))>=this.keyFrames[this.currentFrame].z))
			{
				camera.position.z = this.keyFrames[this.currentFrame].z;
			}
			else if(directionArray[2]==-1 && ((camera.position.z+(this.motionSpeed[2]*directionArray[2]))<=this.keyFrames[this.currentFrame].z))
			{
				camera.position.z = this.keyFrames[this.currentFrame].z;
			}
			else
			{
				camera.position.z += (this.motionSpeed[2]*directionArray[2]);
			}
		}
	}
	getDirection = function(FromVector3, ToVector3)
	{
		var directionArray = [0,0,0];
		
		//X 
		if(ToVector3.x>FromVector3.x)
		{
			if((ToVector3.x-FromVector3.x)<this.positionalCutOff )
			{
				directionArray[0]=0;
			}
			else
			{
				directionArray[0]=1;
			}
		}
		else if(ToVector3.x<FromVector3.x)
		{
			if( (FromVector3.x-ToVector3.x)<this.positionalCutOff )
			{
				directionArray[0]=0;
			}
			else
			{
				directionArray[0]=-1;
			}
		}
		else if(ToVector3.x==FromVector3.x)
		{
			directionArray[0]=0;
		}
		//y
		if(ToVector3.y>FromVector3.y)
		{
			if((ToVector3.y-FromVector3.y)<this.positionalCutOff )
			{
				directionArray[1]=0;
			}
			else
			{
				directionArray[1]=1;
			}
		}
		else if(ToVector3.y<FromVector3.y)
		{
			if((FromVector3.y-ToVector3.y)<this.positionalCutOff )
			{
				directionArray[1]=0;
			}
			else
			{
				directionArray[1]=-1;
			}
		}
		else if(ToVector3.y==FromVector3.y)
		{
			directionArray[1]=0;
		}
		//z
		if(ToVector3.z>FromVector3.z)
		{
			if((ToVector3.z-FromVector3.z)<this.positionalCutOff )
			{
				directionArray[2]=0;
			}
			else
			{
				directionArray[2]=1;
			}
		}
		else if(ToVector3.z<FromVector3.z)
		{
			if((FromVector3.z-ToVector3.z)<this.positionalCutOff )
			{
				directionArray[2]=0;
			}
			else
			{
				directionArray[2]=-1;
			}
		}
		else if(ToVector3.z==FromVector3.z)
		{
			directionArray[2]=0;
		}
		return directionArray;
	}
	exportPoints = function()
	{
		var exportList = "";
		var pointCounter=0;
		
		for(pointCounter=0; pointCounter<this.keyFrames.length; pointCounter++)
		{
			exportList += this.keyFrames[pointCounter].x+","+this.keyFrames[pointCounter].y+","+this.keyFrames[pointCounter].z;
			if(pointCounter+1<this.keyFrames.length)
			{
				exportList+="|";
			}
		}
		return exportList;
	}
	importPoints = function(pointList)
	{
		var importList = pointList.split("|");
		var tempRecord;
		var pointCounter=0;
		
		//Clear config
		this.keyFrames = new Array();
		this.completedAxis = [0,0,0];
		this.currentFrame = 0;
		this.completed = 0;
		//import points
		for(pointCounter=0; pointCounter<importList.length; pointCounter++)
		{
			tempRecord = importList[pointCounter].split(",");
			this.addPoints( new THREE.Vector3(tempRecord[0], tempRecord[1], tempRecord[2]) );
		}
		/*
		//create curve path
		this.addPoints(this.keyFrames[0]);
		this.cameraPathCurve = new THREE.CatmullRomCurve3( this.keyFrames );
		console.log(this.cameraPathCurve);
		*/
	}
}

export default CameraSequencer;