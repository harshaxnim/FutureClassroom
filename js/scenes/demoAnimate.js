import { states, buttonState } from "../render/core/controllerInput.js";
import { active_session } from "../render/core/scene.js";
import * as cg from "../render/core/cg.js";

let debug, head, torso, leftHand, rightHand, indicator, mirror, animator, paletteNode, activeObject = null;

let isAnimate = true, recInProgress = false, frames = [], frameCount=0, animationReady = false, interval = .01, localT = 0.0, interactionMode = 0;

let prevButtonState = {left : [], right : [], head : []};



export const init = async model => {

    
    indicator = model.add('sphere').color(.5,.5,.5);
    
    mirror = model.add();
    mirror.move(0,0,-1);
    head = mirror.add('cube').color(1,0,0).bevel(true);
    torso = mirror.add('tubeY').color(1,0,0).bevel(true);
    leftHand = mirror.add('cube').color(1,0,0).bevel(true);
    rightHand = mirror.add('cube').color(1,0,0).bevel(true);

    animator = model.add();

    paletteNode = model.add();
    paletteNode.options = ['sphere', 'cube', 'tubeY'];
    paletteNode.add('sphere').move(-.1,-.065,-.15).scale(0.02).color(1, 0, 0);
    paletteNode.add('cube').move(0,-.065,-.15).scale(0.02).color(1, 0, 0);
    paletteNode.add('tubeY').move(.1,-.065,-.15).scale(0.02).color(1, 0, 0);

    debug = model.add();
    debug.add("tubeX").scale(.05,.001,.001).color(1,.2,.2);
    debug.add("tubeY").scale(.001,.05,.001).color(.2,1,.2);
    debug.add("tubeZ").scale(.001,.001,.05).color(.2,.2,1);

    model.setTable(false);

}

export const display = model => {

    model.animate(() => {
        if (states.head) {

            if(buttonState.left[5].pressed == true) // quick exit
            {
                console.log("quick exit!");
                active_session.end();
            }


            if(!animationReady) {
                head.setMatrix(states.head.matrix).move(0,-.06,0).scale(.08,.1,.08);
                torso.identity().move(states.head.position.x, states.head.position.y-.5, states.head.position.z).scale(0.18, .25, 0.1).scale(1.1);
                leftHand.setMatrix(states.left.matrix).turnX(Math.PI*(-45)/180).scale(.01, 0.05, .1);
                rightHand.setMatrix(states.right.matrix).turnX(Math.PI*(-45)/180).scale(.01, 0.05, .1);
            }

            if (animationReady) {
                if(localT > interval) {
                    localT = 0;
                    frameCount += 1;
                }
                if(frameCount >= frames.length) frameCount = 0;
                
                head.setMatrix(frames[frameCount].head);
                torso.setMatrix(frames[frameCount].torso);
                leftHand.setMatrix(frames[frameCount].leftHand);
                rightHand.setMatrix(frames[frameCount].rightHand);
                
                for(var i=0; i<animator._children.length; i+=1)
                {
                    console.log(frames[frameCount].animatorFrame[i]);
                    // animator.child(i).setMatrix(cg.mIdentity());
                    animator.child(i).setMatrix(frames[frameCount].animatorFrame[i]);
                }
            }

            indicator.setMatrix(states.right.matrix).move(0,-.065,-.1).scale(.01);
            paletteNode.setMatrix(states.left.matrix);
            
            var im = indicator.getMatrix();
            var indicatorPos = [im[12], im[13], im[14]];
            

            var paletteMatrices = [];
            var paletteMatricesNormalised = [];
            var paletteDistToIndicator = [];
            for(var i=0; i<paletteNode._children.length; i+=1)
            {
                var paletteReativeMatrix = paletteNode.child(i).getMatrix();
                paletteMatrices[i] = cg.mMultiply(states.left.matrix, paletteReativeMatrix);
                paletteMatricesNormalised[i] = cg.mMultiply(states.left.matrix, cg.mTranslate(paletteReativeMatrix[12], paletteReativeMatrix[13], paletteReativeMatrix[14]));
                paletteDistToIndicator[i] = Math.pow(paletteMatricesNormalised[i][12]-im[12], 2)+Math.pow(paletteMatricesNormalised[i][13]-im[13], 2)+Math.pow(paletteMatricesNormalised[i][14]-im[14], 2);
            }
            
            // for(let i=0; i<buttonState.left.length; i+=1)
            // {
            //     if (buttonState.left[i].pressed == true) console.log(i);
            // }
                
            if(prevButtonState.right[1] != buttonState.right[1].pressed) // change of state
            {
                if (buttonState.right[1].pressed == true) { // button down
                    // console.log("down!");
                    
                    // Check collision with animator objects
                    for(var i=0; i<animator._children.length; i+=1)
                    {
                        var obj = animator.child(i);
                        var om = obj.getMatrix();
                        var radius = obj.radius; // scale is the radius in this case.
                        var pos = [om[12], om[13], om[14]];

                        var distToInd = Math.sqrt(Math.pow(om[12]-im[12], 2) + Math.pow(om[13]-im[13], 2) + Math.pow(om[14]-im[14], 2));
                        console.log(distToInd, radius);
                        if(distToInd < radius) // Inside for sure
                        {
                            interactionMode = 2;
                            activeObject = animator.child(i);
                            activeObject.color(1,.1,.1);
                            activeObject.idx = i;
                        }
                    }
                    
                    // Check collision  with Palette
                    for(var i=0; i<paletteNode._children.length; i+=1)
                    {
                        if (paletteDistToIndicator[i] < 0.001) // picked
                        {
                            // debug.setMatrix(psm);
                            interactionMode = 1;
                            activeObject = animator.add(paletteNode.options[i]).setMatrix(paletteMatrices[i]); // XXX change the size
                            activeObject.color(1,.3,.3);
                            activeObject.idx = i;
                            activeObject.originalDist = paletteDistToIndicator[i];
                        }
                    }

                }
                else { // button up
                    // console.log("up!");
                    if(activeObject) {
                        interactionMode = 0;
                        activeObject.color(1,0,0);
                        activeObject = null;
                    }
                }
            }
            if(activeObject && (buttonState.right[1].pressed == true))
            {
                if(interactionMode == 1) // palette object active
                {
                    var rescale = 1+(paletteDistToIndicator[activeObject.idx]-activeObject.originalDist)/0.005;
                    activeObject.setMatrix(paletteMatrices[activeObject.idx]).scale(rescale);
                    activeObject.radius = 0.02*rescale;
                }
                else if(interactionMode == 2) // animator object active
                {
                    var actMat = activeObject.getMatrix();
                    actMat[12] = im[12];
                    actMat[13] = im[13];
                    actMat[14] = im[14];
                }
                
            }
            // A is 4
            // B is 5
            if(buttonState.right[5].pressed == true) // record
            {
                animator.clear();
                frames = [];
                frameCount = 0;
                indicator.color(.5,.5,.5);
                animationReady = false;
            }
            if(buttonState.right[0].pressed == true) // record
            {
                animationReady = false;

                indicator.color(1,0.3,0.3);
                if (localT > interval) { // record the matrix
                    var _animatorFrame = [];
                    for(var i=0; i<animator._children.length; i+=1)
                    {
                        _animatorFrame.push(animator.child(i).getMatrix().slice());
                    }
                    frames.push({head: head.getMatrix(), torso: torso.getMatrix(), leftHand: leftHand.getMatrix(), rightHand: rightHand.getMatrix(), animatorFrame: _animatorFrame});
                    localT = 0;
                }
            }
            else if(frames.length > 0) {
                animationReady = true;
                indicator.color(0.3,1,0.3);
            }
            localT += model.deltaTime;

            for(let i=0; i<buttonState.left.length; i+=1)
            {
                prevButtonState.left[i] = buttonState.left[i].pressed;
                prevButtonState.right[i] = buttonState.right[i].pressed;
            }
            // console.log(buttonState);
        }
    });

}
