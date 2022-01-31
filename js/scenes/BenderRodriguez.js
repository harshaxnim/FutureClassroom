let BenderRodriguez = function() {
	this.init = (model) => {
		this.start = true;
		this.name = "BenderRodriguez";
		this.model = model;
		this.model.move(0,1.7,0).scale(0.2);

		this.torso = this.model.add('tubeY').texture('media/textures/bender/bodyF.jpg');
		
		this.head = this.torso.add('tubeY').texture('media/textures/bender/faceF.png').scale(0.5, 0.65, 0.5).move(0,3,0);
		this.halo = this.head.add('donut').scale(0.9).move(0,2,0).turnX(1.6).color(1,1,.3);
		
		this.leftLeg = this.model.add('tubeY').texture('media/textures/bender/arms_legs.jpg').scale(.2, 1, .2).move(-2,-2.3,0);
		this.rightLeg = this.model.add('tubeY').texture('media/textures/bender/arms_legs.jpg').scale(.2, 1, .2).move(2,-2.3,0);
		
		this.leftHand = this.torso.add('tubeY').texture('media/textures/bender/arms_legs.jpg');
		this.rightHand = this.torso.add('tubeY').texture('media/textures/bender/arms_legs.jpg').scale(.2, 1, .2).move(-7.1,-.1,0);
	}

	this.display = () => {
		this.model.animate(() => {
			this.torso.identity().turnZ(0.02 * Math.sin(0.9*this.model.time)).move(0.02 * Math.sin(0.8*this.model.time), 0.02 * Math.sin(0.5*this.model.time), 0.02 * Math.sin(1*this.model.time));
			this.head.turnX((0.002 * Math.sin(0.9*this.model.time))+(0.002 * Math.sin(9*this.model.time)));
			this.rightLeg.move(0, 0.003 * Math.sin(10*this.model.time), 0);
			this.leftLeg.move(0, 0.003 * Math.sin((10*this.model.time)+Math.PI), 0);
			this.leftHand.identity().turnZ(-.4 + 0.1 * Math.sin((7*this.model.time)+Math.PI)*Math.cos((4*this.model.time)+Math.PI)).scale(.2, 1, .2).move(4.5,2.5,0);//.turnZ(0.003 * Math.sin((10*this.model.time)+Math.PI));
		});
	}
}

export let benderRodriguez = new BenderRodriguez();
