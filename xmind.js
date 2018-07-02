'use strict';

const DefaultSize = 14;
const MinTextWidth = 120;
const IconSize = 16;
const BaseOffsetY = 30;
const BaseOffsetX = 50;

function loadXML(xmlurl){
    var xmlDoc;
    try{     //IE
        xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
    }catch(e){  //firefox,opera
        xmlDoc = document.implementation.createDocument("","",null);
    }

    try{
        xmlDoc.async = false;
        xmlDoc.asyc = false;   //是否异步调用
        xmlDoc.load(xmlurl);  //文件路径
    }catch(e){  //chrome
        var xmlhttp = new window.XMLHttpRequest();
        xmlhttp.open("GET",xmlurl,false);   //创建一个新的http请求，并指定此请求的方法、URL以及验证信息
        xmlhttp.send(null);
        xmlDoc = xmlhttp.responseXML;
    }

    return xmlDoc;
}

function loadXMLText(text) {
    var xmlDoc;
    if (window.DOMParser) {
        //非IE浏览器
        xmlDoc = (new DOMParser()).parseFromString(text, "text/xml");
    } else {
        //IE浏览器
        xmlDoc = new ActiveXObject("Microsoft.XMLDOM");         
        // 或者：xmlDoc = new ActiveXObject("MSXML2.DOMDocument");      
        xmlDoc.async = "false";        //不启用异步，保证加载文件成功之前不会进行下面操作
        xmlDoc.loadXML(text);
    }
    return xmlDoc           
}


function fillRoundRect(cxt,x,y,width,height,radius,/*optional*/fillColor){  
    //圆的直径必然要小于矩形的宽高          
    if(2*radius>width || 2*radius>height){return false;}  
    cxt.save();  
    cxt.translate(x,y);  
    //绘制圆角矩形的各个边  
    drawRoundRectPath(cxt,width,height,radius);  
    cxt.fillStyle=fillColor||"#000";//若是给定了值就用给定的值否则给予默认值  
    cxt.fill();  
    cxt.restore();  
}  


/**该方法用来绘制圆角矩形 
 *@param cxt:canvas的上下文环境 
 *@param x:左上角x轴坐标 
 *@param y:左上角y轴坐标 
 *@param width:矩形的宽度 
 *@param height:矩形的高度 
 *@param radius:圆的半径 
 *@param lineWidth:线条粗细 
 *@param strokeColor:线条颜色 
 **/  
function strokeRoundRect(cxt,x,y,width,height,radius,/*optional*/lineWidth,/*optional*/strokeColor){  
    //圆的直径必然要小于矩形的宽高          
    if(2*radius>width || 2*radius>height){return false;}  

    cxt.save();  
    cxt.translate(x,y);  
    //绘制圆角矩形的各个边  
    drawRoundRectPath(cxt,width,height,radius);  
    cxt.lineWidth = lineWidth||1;//若是给定了值就用给定的值否则给予默认值2  
    cxt.strokeStyle=strokeColor||"#000";  
    cxt.stroke();  
    cxt.restore();  
}  

function drawRoundRectPath(cxt,width,height,radius){  
    cxt.beginPath(0);  
    //从右下角顺时针绘制，弧度从0到1/2PI  
    cxt.arc(width-radius,height-radius,radius,0,Math.PI/2);  

    //矩形下边线  
    cxt.lineTo(radius,height);  

    //左下角圆弧，弧度从1/2PI到PI  
    cxt.arc(radius,height-radius,radius,Math.PI/2,Math.PI);  

    //矩形左边线  
    cxt.lineTo(0,radius);  

    //左上角圆弧，弧度从PI到3/2PI  
    cxt.arc(radius,radius,radius,Math.PI,Math.PI*3/2);  

    //上边线  
    cxt.lineTo(width-radius,0);  

    //右上角圆弧  
    cxt.arc(width-radius,radius,radius,Math.PI*3/2,Math.PI*2);  

    //右边线  
    cxt.lineTo(width,height-radius);  
    cxt.closePath();  
}  

function getTextWidth(text) {
    // re-use canvas object for better performance
    var canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
    var context = canvas.getContext("2d");
    context.font = DefaultSize + 'px serif'; ;
    var metrics = context.measureText(text);
    return metrics.width;
}


function drawIcon(ctx, icon, x, y) {
    var image = new Image(IconSize, IconSize);
    image.onload = function(){
        ctx.drawImage(image,x,y,IconSize,IconSize);
    }
    image.src = icon;
}



function compareMarker(a, b) {
    return a.index - b.index;
}


class MarkerSheetXML {
    constructor(){
        this.markers = {};
        try {
            var xmldoc = loadXML('markers/markerSheet.xml')
            var markerNodes = xmldoc.getElementsByTagName('marker');
            var startIndex = 0;
            for(var index = 0; index < markerNodes.length; index++) {
                var child = markerNodes.item(index);
                var marker = {};
                var attris = child.attributes;
                for(var i = 0; i < attris.length; i ++) {
                    marker[attris[i].name] = attris[i].value
                }
                marker.index = startIndex;
                //this.markers.push(marker);
                startIndex ++;
                this.markers[marker.id] = marker;
            }    
        }catch(e) {
            console.log(e);
        }

    }

findMarkerById(idStr) {
    return this.markers[idStr]
}
}


const markerSheet = new MarkerSheetXML();




class XMLParser {

    constructor(text,isUrl=true) {
        if(isUrl) {
            this.xmldoc = loadXML(text)
        }else {
            this.xmldoc = loadXMLText(text)
        }
                //   console.log(this.xmldoc)
        var sheets = this.xmldoc.getElementsByTagName('sheet')
        this.sheets = sheets
    }

    parse(){
        //console.log(this.sheets);
        var mainSheet = this.sheets.item(0);
        var node = new XNode();
        node.rootNode = node;
        node.x = 60;
        node.y = 50;
        var topicNode = null;
        var childNodes = mainSheet.childNodes;
        for (var i = 0 ; i < childNodes.length; i++) {
            var child = childNodes[i];
            var nodeName = child.nodeName;
            if(nodeName == 'topic') {
                topicNode = child;
            }
        }
        if(topicNode) {
            node.parseXMLNode(topicNode)    
        }
        return node;
    }

}



class BaseNode {
    constructor(){
        this.subNodes = [];
    }

    addToContext(context){
        this.ctx = context;
        for(var i = 0; i < this.subNodes.length; i++) {
            this.subNodes[i].addToContext(context);  
        }
    }

    addChildNode(node) {
        node.parentNode = this;
        node.rootNode = this.rootNode;
        this.subNodes.push(node);
    }

   
    clearEvent(){
        this.ctx.canvas.removeEventListener('click', this.clickEvent,true);
    }

    removeChildNode(node) {
        this.subNodes = this.subNodes.filter(function(item) { 
            return item !== node;
        });
        node.relayout();
        var ctx = this.ctx;
        //console.log("" + node.height + ":" + this.height + ":" + this.parentNode.subNodes.length);
        if(node.height == this.height && this.subNodes.length == 0) {
            ctx.clearRect(this.x,this.y - BaseOffsetY/2,this.width,this.height+ 5);
            this.draw();
            return;
        }
        ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
        this.rootNode.relayout();
        
        this.resizeCanvas();
        this.rootNode.draw();
    }

    resizeCanvas(){
        var ctx = this.ctx;
        ctx.canvas.width = this.rootNode.width + 100 + this.rootNode.x;
        ctx.canvas.height = this.rootNode.height + 100 + this.rootNode.y;    
    }

    computeContentSize(){
    
    }


    relayout(){
        this.clearEvent();
        this.height = 0;
        var offsetY = 0;
        for(var i = 0; i < this.subNodes.length; i++) {
            var childNode = this.subNodes[i];
            childNode.clearEvent();
            childNode.x = this.x + this.c_width + BaseOffsetX;
            childNode.y = this.y + offsetY;
            childNode.relayout();           
            if(childNode.width > this.maxChildW) {
                this.maxChildW = childNode.width;
            }
            this.height = this.height + childNode.height;
            offsetY = childNode.height +  offsetY;
            offsetY = offsetY + BaseOffsetY;
            if(i > 0 ) {
                this.height = this.height + BaseOffsetY;
            }
        }
        this.computeContentSize();
    }

    draw() {
        this.drawRoundSide();
        this.drawSelf();
        var offsetX = BaseOffsetX / 4
        var x = this.c_width + this.x + offsetX
        var lastY = 0;
        for(var i = 0; i < this.subNodes.length; i++) {
            var child = this.subNodes[i];  
            var x1 = child.x 
            var y = child.y + child.height / 2 - child.c_height / 2
            var y1 = y

            this.drawLine(x,y,x1,y1)
            child.draw();
            if(i > 0) {
                this.drawLine(x,y,x,lastY)
            }
            lastY = y;           
        }
        if(lastY > 0) {
            var y = this.y + this.height / 2 - this.c_height / 2;
            this.drawLine(x-offsetX,y,x,y)

        }
    }

    removeSelf(){
     if(this.parentNode) {
       this.parentNode.removeChildNode(this);     
     } 
    }

    onclick() {
        this.removeSelf();
    }

    drawLine(x,y,x1,y1) {
        this.ctx.beginPath()
        this.ctx.moveTo(x,y)
        this.ctx.lineTo(x1, y1)
        this.ctx.stroke();
    }

    drawRoundSide() {
        this.ctx.lineJoin = "round";
        //strokeRoundRect(this.ctx,this.x,this.y - BaseOffsetY/2,this.width,this.height+ 5,5);
        var width = this.c_width;
        var height = this.c_height;
        var x = this.x;
        var y = this.y + this.height / 2  - height;
        strokeRoundRect(this.ctx,x,y,this.c_width,height,5);
        var that = this;
        this.clickEvent = function(e) {
            if(e.offsetX > x && e.offsetX < x+width && e.offsetY > y && e.offsetY < y + height) {
                that.onclick();
            }
        }
        this.ctx.canvas.addEventListener('click', this.clickEvent,true);
    }

    drawSelf(){


    }
}


class TextNode extends BaseNode{
    drawSelf() {
        if(this.text) {
            var x = this.x
            var y = this.y + this.height / 2 - DefaultSize / 2;
            if(this.c_width == MinTextWidth) {
                var text_w =  getTextWidth(this.text);
                x = x + (MinTextWidth - text_w) / 2
            }else {
                x = x + 10;
            }
            this.ctx.font = DefaultSize + 'px serif';
            this.ctx.fillText(this.text, x, y);
        }
    }

    computeContentWidth(text) {
        this.c_width =  getTextWidth(text) + 20;
        if(this.c_width < MinTextWidth) {
            
        }
        return this.c_width;
    }

    computeContentSize(){
        this.c_width = this.computeContentWidth(this.text)
        var height = DefaultSize * 1.5;
        if(this.height < height) {
            this.height = height;
        }

        this.c_height = height;
        if(this.c_height < IconSize*1.5) {
            this.c_height = IconSize*1.5;
        }
        this.width = this.c_width + this.maxChildW + BaseOffsetX;
    }

    parseText(xmlNode) {
        if(xmlNode) {
            this.text = xmlNode.innerHTML;  
            this.computeContentWidth(this.text);

        }
    }
}



const IconTextPadding = 4;

class IconTextNode extends TextNode {

    parseIcon(xmlNode) {
        this.icons = [];
        if(xmlNode) {
            var children = xmlNode.children;
            for(var i = 0; i < children.length; i++) {
                var child = children.item(i);
                for (var index = 0; index < child.attributes.length; index++) {
                    if(child.attributes[index].name == 'marker-id') {
                        var marker = markerSheet.findMarkerById(child.attributes[index].value);
                        this.icons.push(marker)
                    }
                }
            }
            this.icons.sort(compareMarker);
            this.c_width = this.c_width + this.icons.length * (IconSize + IconTextPadding);
        }
    }

    computeContentSize(){
        super.computeContentSize();
        this.c_width = this.c_width + this.icons.length * (IconSize + IconTextPadding);
        if(this.icons.length > 0 && this.text.length == 0) {
            this.c_width = this.c_width - IconTextPadding;
            //this.c_width = this.c_width  + IconTextPadding * (this.icons.length); 
        }
        this.width = this.c_width + this.maxChildW + BaseOffsetX;
    }

    drawSelf() {
        var x = this.x;
        var height = DefaultSize * 1.5
        var y = this.y + this.height / 2 - this.c_height / 2 - IconSize / 2;

        if(this.c_width == MinTextWidth) {
            var text_w =  getTextWidth(this.text);
            x = x + (MinTextWidth - text_w) / 2
        }else {
            x = x + 10;
        }        
        var ctx = this.ctx;
        for(var index = 0; index < this.icons.length; index ++) {
            var icon = "./markers/" + this.icons[index]['resource'].replace(".","@" + IconSize + ".")
            drawIcon(ctx, icon, x, y);
            x = x + IconSize + IconTextPadding;
        }

        var newy = this.y + this.height / 2 - DefaultSize / 2;
        ctx.font = DefaultSize + 'px serif';
        ctx.fillText(this.text, x, newy);
        //super.drawSelf();       
    }
}


class XNode extends IconTextNode{

    initSelf(){
        this.computeSize();
    }


    parseChilds(xmlNode) {
        if(xmlNode) {
            var subChildNodes = xmlNode.firstChild.children;
            var offsetY = 0;
            for(var index = 0; index < subChildNodes.length; index++){
                var subNode = subChildNodes.item(index);
                var childNode = new XNode()
                this.addChildNode(childNode);
                childNode.x = this.x + this.c_width + BaseOffsetX;
                childNode.y = this.y + offsetY;
                childNode.parseXMLNode(subNode)
                if(childNode.width > this.maxChildW) {
                    this.maxChildW = childNode.width;
                }
                this.height = this.height + childNode.height;
                offsetY = childNode.height +  offsetY;
                offsetY = offsetY + BaseOffsetY;
                if(index > 0 ) {
                    this.height = this.height + BaseOffsetY;
                }
            }
        }
    }

    parseXMLNode(xmlNode) {
        this.maxChildW = 0;
        this.height = 0;
        this.c_width = MinTextWidth;
        this.subNodes = [];
        var childNodes = xmlNode.children;
        this.width = 100;
        this.text = "";

        var titleNode = null;
        var makerNode = null;
        var childrenNode = null;
        for (var i = 0 ; i < childNodes.length; i++) {
            var child = childNodes[i];
            var nodeName = child.nodeName;
            if(nodeName == 'title') {
                titleNode = child;
            }else if(nodeName == 'children') {
                childrenNode = child
            }else if(nodeName == 'marker-refs') {
                makerNode = child;
            }
        }
        this.parseText(titleNode);
        this.parseIcon(makerNode);
        this.parseChilds(childrenNode);
        this.computeContentSize();
    }
 
    computeSize(){
        var height = DefaultSize * 1.5;
        if(this.height < height) {
            this.height = height;
        }

        this.c_height = height;
        if(this.c_height < IconSize*1.5) {
            this.c_height = IconSize*1.5;
        }

        if(this.text) {
            this.width = this.c_width + this.maxChildW + BaseOffsetX;
        }
    }

    setPostion(x, y) {
        this.c_config['x'] = x;
        this.c_config['y'] = y;
        for(var index = 0; index < this.children.length; index++){
            var child = this.children[index]
            child.x(x)
            child.y(y)
        }
    }
}
