var x=document.getElementsByTagName("p")[0].innerText;
var y=document.getElementsByTagName("p")[1].innerText;
var roomnum = 0;
var icon ="";
var socket = io.connect('http://'+x+':2512');
document.getElementsByTagName("p")[0].innerText="";
socket.on('connect', function (data) {
    socket.emit('join',y);
});
//listen event
//tao ban co
var banco = [];
var hang = [];
var roombefor = "";
for(let j = 0;j<16;j++)
		hang.push("__");
for(let i = 0;i<16;i++)
{
	banco.push([...hang]);
}
function clearbanco(){
	for(let i=0;i<256;i++)
{
	let j=document.getElementsByClassName("caroplay")[i];
	j.innerText = "";
}
banco = [];
for(let i = 0;i<16;i++)
{
	banco.push([...hang]);
}
}
//draw button caro
var w = $(".caroplay:first").css("width");
for(let i=0;i<256;i++)
{
	let j=document.getElementsByClassName("caroplay")[i];
	j.style.height = w;
	j.id = "carobutton"+i;
}
//var person = prompt("Please enter your name", "Harry Potter");
disactivateturn(true);
function disactivateturn(n)
{
	for(let i=0;i<256;i++)
{
	let j = document.getElementsByClassName("caroplay")[i];
	if(!j.innerText)	
		j.disabled = n;
}
}
function activateclick(n)
{
	for(let i=0;i<256;i++)
{
	let j=document.getElementsByClassName("caroplay")[i].onclick = function(){
		caro(i,n);
	};
}
}

function checkwin(x,y){
	let winline = [];
	for(let i = x-1;i<x+2;i++)
		for(let j = y-1;j<y+2;j++)
			if(checkslot(i,j)&&banco[i][j]==banco[x][y]){
				winline.push(checkline(x,y,x-i,y-j,banco[x][y]));
			}
	if(winline.length=!0&&winline.indexOf(true)!=-1) return true;
	else return false;
}
function checkslot(x,y){
	return x>=0&&x<16&&y>=0&&y<16;
}
function checkline(x,y,dentax,dentay,icon){
	let num = 1;
	let mul = 1;
	if(dentax==0&&dentay==0) return false;
	while(true){
		if(checkslot(x-mul*dentax,y-mul*dentay)&&banco[x-mul*dentax][y-mul*dentay]==icon){
			num++;
			if(checkslot(x+mul*dentax,y+mul*dentay)&&banco[x+mul*dentax][y+mul*dentay]==icon)
				num++;
			mul++;
			continue;
		}
		else if(checkslot(x+mul*dentax,y+mul*dentay)&&banco[x+mul*dentax][y+mul*dentay]==icon){
			num++;
			if(checkslot(x-mul*dentax,y-mul*dentay)&&banco[x-mul*dentax][y-mul*dentay]==icon)
				num++;
			mul++;
			continue;
		}
		else break;
	}
	if(num>=5)
		return true;
	else
		return false;
}

//play caro
function caro (n=0,m="__"){
	let name = document.getElementById("roomname").innerText;
	let j = document.getElementById("carobutton"+n);
	let x = Math.floor(n/16);
	let y = n%16;
	banco[x][y] = m;
	j.innerText = m;
	j.disabled = true;
	disactivateturn(true);
	socket.emit("gocaro",{room:name,slot:n,icon:m});
	if(checkwin(x,y)){
		let m = $('#result2');
		m.removeAttr("class");
		m.empty();
		m.addClass("text-primary");
		m.append("<p>You WIN</p>");
		$('.lightbox').css("display","block");
		let name = document.getElementById("roomname").innerText;
		socket.emit("result",{room:name,result:"<p>You LOSE</p>"});
		disactivateturn(true);
		leaveroom("2");
	}
}

socket.on("catchgocaro",function(data){
	let c = document.getElementById("carobutton"+data.slot);
	let x = Math.floor(parseInt(data.slot)/16);
	let y = parseInt(data.slot)%16;
	banco[x][y] = data.icon;
	c.innerText = data.icon;
	c.disabled = true;
	disactivateturn(false);
});


socket.on('thread', function (data) {
    $('#thread').append('<li class="list-group-item list-group-item-action">' + data + '</li>');
});

socket.on('users', function (data) {
    $('#user').append('<li class="list-group-item list-group-item-action">' + data + '</li>');
});

$('form').submit(function(){
    var message = $('#message').val();
    socket.emit('messages',y+":  "+message);
    this.reset();

    return false;
});

//list_room
socket.on("numofroom",function(data){
	while(roomnum<data){
	roomnum++;
	$('#roomlist').append('<tr class="text-center"><td colspan="2"><button class="btn-primary btn col" id="room'+roomnum+'">Room_'+roomnum+'</button></td></tr>');
	let i = roomnum;
	$('#room'+i).click(function(){
	let name = document.getElementById("room"+i).innerText;
	socket.emit("joinroom",name);
	});
}
});
//create rooom
$('#create').click(function(){
	roomnum++;
	$('#roomlist').append('<tr class="text-center"><td colspan="2"><button class="btn-primary btn col" id="room'+roomnum+'">Room_'+roomnum+'</button></td></tr>');
	let i = roomnum;
	socket.emit("createroom",i);
	$('#room'+i).click(function(){
		let name = document.getElementById("room"+i).innerText;
		socket.emit("joinroom",name);
});
});
//room created
socket.on("createdroom",function(data){
	roomnum++;
	$('#roomlist').append('<tr class="text-center"><td colspan="2"><button class="btn-primary btn col" id="room'+roomnum+'">Room_'+roomnum+'</button></td></tr>');
	let i = roomnum;
	$('#room'+i).click(function(){
		let name = document.getElementById("room"+i).innerText;
		socket.emit("joinroom",name);
});
	$('#room'+i).prop("disabled",$('#delete').prop("disabled"));
});
//delete room
$('#delete').click(function(){
	if(roomnum>0)
	{
	$('tr').last().remove();
	roomnum--;
	socket.emit("deleteroom",1);
}
});
socket.on("deletedroom",function(data){
	if(roomnum>0)
	{
	$('tr').last().remove();
	roomnum--;
}
});
//join rooms
function joinroom(n=1){
	let name = document.getElementById("room"+n).innerText;
	socket.emit("joinroom",name);
}

function disactivaterooms(s=true){
	$('#create').prop("disabled",s);
	$('#delete').prop("disabled",s);
	for(let i = 1;i<=roomnum;i++)
	{
		$('#room'+i).prop("disabled",s);
	}
}
socket.on("ssjoinroom",function(data){
	let n = document.getElementById("roomname");
	n.innerText=data.room;
	activateclick(data.icon);
	icon = data.icon;
	//if(data.icon=="X") disactivateturn(false);
	disactivaterooms();
	clearbanco();
});
socket.on("ffjoinroom",function(data){
	let n = $('#result');
	n.removeAttr("class");
	n.empty();
	n.addClass("alert alert-info");
	n.append("<p>"+data+"</p>");
});

socket.on("startgame",function(data){
	$('#result').removeAttr("class");
	$('#result').empty();
	$('#result').addClass("alert alert-info");
	$('#result').append("<p>"+data+"</p>");
	if(icon=="X") disactivateturn(false);
});
socket.on("waitgame",function(data){
	$('#result').removeAttr("class");
	$('#result').empty();
	$('#result').addClass("alert alert-info");
	$('#result').append("<p>"+data+"</p>");
	disactivateturn(true);
});
function leaveroom(n=""){
	let name = document.getElementById("roomname");
	socket.emit("leaveroom"+n,{room:name.innerText,rule:icon});
	roombefor = name.innerText;
	name.innerText = "...";
	clearbanco();
	$('#result').removeAttr("class");
	$('#result').empty();
	disactivaterooms(false);
	disactivateturn(true);
}
$('#leaveroom').click(function(){
	leaveroom();
});
$("#leaveroom2").click(function(){
	$('.lightbox').css("display","none");
});
$("#playagain").click(function(){
	$('.lightbox').css("display","none");
	socket.emit("joinroom",roombefor);
}),
socket.on("lose",function(data){
	leaveroom("2");
	let m = $('#result2');
	m.removeAttr("class");
	m.empty();
	m.addClass("text-danger");
	m.append(data);
	$('.lightbox').css("display","block");	
	disactivateturn(true);
	
});

socket.on('disconnected', function(data){
	let i = $('#user');
	i.empty();
	data.forEach(n=>{
		i.append('<li>' + n + '</li>');
	});
});