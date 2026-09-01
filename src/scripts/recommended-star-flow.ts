// 推荐友链卡的金色星星流动特效（Aemeath 同款 web component）
// 在 FriendCard.astro 中通过 <recommended-star-flow> 包装 <canvas> 使用

if (!customElements.get("recommended-star-flow")) {
	class RecommendedStarFlow extends HTMLElement {
		canvas: HTMLCanvasElement | null;
		context: CanvasRenderingContext2D | null;
		card: HTMLElement | null;
		particles: any[];
		width: number;
		height: number;
		pixelRatio: number;
		elapsed: number;
		lastTimestamp: number;
		animationFrame: number;
		resizeFrame: number;
		hoverAmount: number;
		hoverTarget: number;
		initialized: boolean;
		resizeObserver: ResizeObserver | null;
		initializeFrame: number;

		constructor() {
			super();
			this.canvas = null;
			this.context = null;
			this.card = null;
			this.particles = [];
			this.width = 0;
			this.height = 0;
			this.pixelRatio = 1;
			this.elapsed = 0;
			this.lastTimestamp = 0;
			this.animationFrame = 0;
			this.resizeFrame = 0;
			this.hoverAmount = 0;
			this.hoverTarget = 0;
			this.initialized = false;
			this.resizeObserver = null;
			this.initializeFrame = 0;

			this.handleFrame = this.handleFrame.bind(this);
			this.initialize = this.initialize.bind(this);
			this.handleResize = this.handleResize.bind(this);
			this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
			this.handlePointerEnter = this.handlePointerEnter.bind(this);
			this.handlePointerLeave = this.handlePointerLeave.bind(this);
			this.handleFocusIn = this.handleFocusIn.bind(this);
			this.handleFocusOut = this.handleFocusOut.bind(this);
		}

		connectedCallback() {
			if (this.initialized) return;
			if (document.readyState === "loading") {
				document.addEventListener("DOMContentLoaded", this.initialize, {
					once: true,
				});
				return;
			}
			this.scheduleInitialize();
		}

		scheduleInitialize() {
			if (this.initialized || !this.isConnected || this.initializeFrame) return;
			this.initializeFrame = requestAnimationFrame(() => {
				this.initializeFrame = 0;
				this.initialize();
			});
		}

		initialize() {
			if (this.initialized || !this.isConnected) return;
			this.canvas = this.querySelector(".friend-recommended-canvas");
			this.context = this.canvas?.getContext("2d", { alpha: true }) || null;
			this.card = this.closest(".friend-card-link--recommended");

			if (!this.canvas || !this.context) {
				this.scheduleInitialize();
				return;
			}
			this.initialized = true;

			this.particles = this.createParticles();

			this.card?.addEventListener("pointerenter", this.handlePointerEnter);
			this.card?.addEventListener("pointerleave", this.handlePointerLeave);
			this.card?.addEventListener("focusin", this.handleFocusIn);
			this.card?.addEventListener("focusout", this.handleFocusOut);
			document.addEventListener(
				"visibilitychange",
				this.handleVisibilityChange,
			);

			if (typeof ResizeObserver !== "undefined") {
				this.resizeObserver = new ResizeObserver(this.handleResize);
				this.resizeObserver.observe(this);
			} else {
				window.addEventListener("resize", this.handleResize, { passive: true });
			}

			this.resizeFrame = requestAnimationFrame(this.handleResize);
			this.updatePlayback();
		}

		disconnectedCallback() {
			document.removeEventListener("DOMContentLoaded", this.initialize);
			if (this.initializeFrame) {
				cancelAnimationFrame(this.initializeFrame);
				this.initializeFrame = 0;
			}
			this.stopAnimation();
			cancelAnimationFrame(this.resizeFrame);
			this.resizeObserver?.disconnect();
			window.removeEventListener("resize", this.handleResize);
			document.removeEventListener(
				"visibilitychange",
				this.handleVisibilityChange,
			);
			this.card?.removeEventListener("pointerenter", this.handlePointerEnter);
			this.card?.removeEventListener("pointerleave", this.handlePointerLeave);
			this.card?.removeEventListener("focusin", this.handleFocusIn);
			this.card?.removeEventListener("focusout", this.handleFocusOut);
			this.initialized = false;
		}

		createParticles() {
			let seed = 0x51a7c0de;
			const random = () => {
				seed = (seed * 1664525 + 1013904223) >>> 0;
				return seed / 4294967296;
			};
			const layerPattern = [0, 1, 0, 2, 1, 0, 1, 2, 0, 1, 0, 2, 1, 0, 1, 2];
			const ySlots = [
				0.2, 0.7, 0.43, 0.77, 0.17, 0.57, 0.32, 0.64, 0.82, 0.5, 0.25, 0.73,
				0.16, 0.84, 0.39, 0.58,
			];
			const layers = [
				{
					radius: [3.1, 4.35],
					alpha: [0.56, 0.7],
					float: [1.9, 3.5],
					curve: [2.1, 3.9],
					glow: [4, 7],
				},
				{
					radius: [4.5, 6.25],
					alpha: [0.72, 0.88],
					float: [2.9, 5],
					curve: [3.5, 6],
					glow: [7, 11],
				},
				{
					radius: [6.3, 8.35],
					alpha: [0.88, 1],
					float: [4, 6.4],
					curve: [4.8, 7.8],
					glow: [11, 16],
				},
			];
			const between = (range) => range[0] + (range[1] - range[0]) * random();

			return Array.from({ length: 16 }, (_, index) => {
				const layer = layerPattern[index];
				const profile = layers[layer];
				return {
					index,
					layer,
					phase: index / 16,
					baseY: ySlots[index],
					radius: between(profile.radius),
					baseAlpha: between(profile.alpha),
					floatAmplitude: between(profile.float),
					curveAmplitude: between(profile.curve),
					glow: between(profile.glow),
					xDrift: 0.8 + random() * (1.3 + layer * 0.85),
					driftFrequency: 0.62 + random() * 0.72,
					curvePhase: random() * Math.PI * 2,
					twinklePhase: random() * Math.PI * 2,
					twinkleSpeed: 0.88 + random() * 1.05,
					rotation: random() * Math.PI * 2,
					rotationSpeed:
						(0.2 + random() * (0.18 + layer * 0.09)) *
						(random() > 0.5 ? 1 : -1),
					hasTrail: layer > 0 || index % 4 === 0,
					tailScale: 3.2 + random() * 1.7 + layer * 0.75,
				};
			}).sort((a, b) => a.layer - b.layer);
		}

		handleResize() {
			cancelAnimationFrame(this.resizeFrame);
			if (!this.isConnected || !this.canvas || !this.context) return;
			const bounds = this.getBoundingClientRect();
			const width = Math.max(1, Math.round(bounds.width));
			const height = Math.max(1, Math.round(bounds.height));
			const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

			if (
				width !== this.width ||
				height !== this.height ||
				pixelRatio !== this.pixelRatio
			) {
				this.width = width;
				this.height = height;
				this.pixelRatio = pixelRatio;
				this.canvas.width = Math.round(width * pixelRatio);
				this.canvas.height = Math.round(height * pixelRatio);
				this.context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
			}

			this.renderFrame();
		}

		handleFrame(timestamp) {
			if (!this.shouldAnimate()) {
				this.animationFrame = 0;
				return;
			}

			const delta = this.lastTimestamp
				? Math.min(42, timestamp - this.lastTimestamp)
				: 0;
			this.lastTimestamp = timestamp;
			this.hoverAmount +=
				(this.hoverTarget - this.hoverAmount) * Math.min(1, delta / 180);
			const speed = 1 + this.hoverAmount * 0.14;
			this.elapsed += delta * speed;
			this.renderFrame();
			this.animationFrame = requestAnimationFrame(this.handleFrame);
		}

		renderFrame() {
			if (!this.context || !this.width || !this.height) return;
			const context = this.context;
			context.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
			context.clearRect(0, 0, this.width, this.height);

			const time = this.elapsed / 1000;
			const cycleDuration = 4600;
			const beamDuration = 3800;
			const beamProgress = (this.elapsed % beamDuration) / beamDuration;
			const easedBeam = beamProgress * beamProgress * (3 - 2 * beamProgress);
			const beamX = (-0.16 + easedBeam * 1.32) * this.width;
			const beamSpread = Math.max(24, this.width * 0.13);

			for (const particle of this.particles) {
				const progress = (particle.phase + this.elapsed / cycleDuration) % 1;
				const radius = particle.radius;
				const enterDistance = Math.max(0, Math.min(1, progress / 0.14));
				const exitDistance = Math.max(0, Math.min(1, (1 - progress) / 0.2));
				const enterFade =
					enterDistance * enterDistance * (3 - 2 * enterDistance);
				const exitFade = exitDistance * exitDistance * (3 - 2 * exitDistance);
				const edgeFade = enterFade * exitFade;
				const drift = Math.sin(
					time * particle.driftFrequency + particle.twinklePhase,
				);
				const curveAngle = progress * Math.PI * 2 + particle.curvePhase;
				const rawX =
					radius +
					progress * Math.max(1, this.width - radius * 2) +
					drift * particle.xDrift;
				const x = Math.max(radius, Math.min(this.width - radius, rawX));
				const rawY =
					particle.baseY * this.height +
					Math.sin(curveAngle) * particle.curveAmplitude +
					Math.sin(progress * Math.PI * 2 - time * 0.72) *
						(1.6 + particle.layer * 1.15) +
					drift * particle.floatAmplitude;
				const safeY = radius + Math.min(5, particle.glow * 0.34) + 2;
				const y = Math.max(safeY, Math.min(this.height - safeY, rawY));
				const beamDistance = x - beamX;
				const beamBoost = Math.exp(
					-(beamDistance * beamDistance) / (2 * beamSpread * beamSpread),
				);
				const twinkle =
					0.9 +
					Math.sin(time * particle.twinkleSpeed + particle.twinklePhase) * 0.08;
				const scale =
					0.94 + twinkle * 0.06 + beamBoost * 0.24 + this.hoverAmount * 0.08;
				const alpha = Math.min(
					1,
					particle.baseAlpha *
						edgeFade *
						(twinkle + beamBoost * 0.38 + this.hoverAmount * 0.13),
				);
				const rotation =
					particle.rotation +
					time * particle.rotationSpeed +
					Math.sin(curveAngle) * 0.08;

				if (particle.hasTrail) {
					this.drawTrail(
						context,
						particle,
						x,
						y,
						radius * scale,
						curveAngle,
						alpha,
						beamBoost,
					);
				}

				this.drawStar(
					context,
					particle,
					x,
					y,
					radius * scale,
					rotation,
					alpha,
					beamBoost,
				);
			}
		}

		drawTrail(context, particle, x, y, radius, curveAngle, alpha, beamBoost) {
			const tailLength = radius * particle.tailScale;
			const slope =
				(particle.curveAmplitude * Math.PI * 2 * Math.cos(curveAngle)) /
				Math.max(this.width, 1);
			const startX = x - tailLength;
			const startY = y - slope * tailLength;
			const gradient = context.createLinearGradient(startX, startY, x, y);
			gradient.addColorStop(0, "rgba(248, 197, 76, 0)");
			gradient.addColorStop(
				1,
				`rgba(248, 192, 59, ${Math.min(0.7, alpha * (0.45 + beamBoost * 0.22))})`,
			);

			context.save();
			context.globalCompositeOperation = "source-over";
			context.strokeStyle = gradient;
			context.lineWidth = Math.max(0.9, radius * 0.48);
			context.lineCap = "round";
			context.shadowColor = `rgba(244, 182, 47, ${0.38 + beamBoost * 0.3})`;
			context.shadowBlur = 5 + beamBoost * 7;
			context.beginPath();
			context.moveTo(startX, startY);
			context.quadraticCurveTo(
				x - tailLength * 0.45,
				y - slope * tailLength * 0.24,
				x - radius * 0.7,
				y,
			);
			context.stroke();
			context.restore();
		}

		drawStar(context, particle, x, y, radius, rotation, alpha, beamBoost) {
			const fillColors = ["255, 220, 125", "250, 200, 76", "246, 185, 50"];
			const fill = fillColors[particle.layer];

			context.save();
			context.translate(x, y);
			context.globalCompositeOperation = "source-over";
			context.shadowColor = `rgba(241, 171, 31, ${0.48 + beamBoost * 0.3})`;
			context.shadowBlur =
				particle.glow + beamBoost * 10 + this.hoverAmount * 3;
			this.traceRoundedStar(context, radius, rotation, 0.18);
			context.fillStyle = `rgba(${fill}, ${alpha})`;
			context.fill();
			context.strokeStyle = `rgba(255, 247, 193, ${Math.min(1, alpha + 0.16)})`;
			context.lineWidth = 0.72 + particle.layer * 0.18;
			context.stroke();
			context.restore();
		}

		traceRoundedStar(context, outerRadius, rotation, rounding) {
			const innerRadius = outerRadius * 0.48;
			const points = Array.from({ length: 10 }, (_, index) => {
				const radius = index % 2 === 0 ? outerRadius : innerRadius;
				const angle = rotation - Math.PI / 2 + (index * Math.PI) / 5;
				return {
					x: Math.cos(angle) * radius,
					y: Math.sin(angle) * radius,
				};
			});
			const first = points[0];
			const last = points[points.length - 1];

			context.beginPath();
			context.moveTo(
				first.x + (last.x - first.x) * rounding,
				first.y + (last.y - first.y) * rounding,
			);

			points.forEach((point, index) => {
				const previous = points[(index + points.length - 1) % points.length];
				const next = points[(index + 1) % points.length];
				const beforeX = point.x + (previous.x - point.x) * rounding;
				const beforeY = point.y + (previous.y - point.y) * rounding;
				const afterX = point.x + (next.x - point.x) * rounding;
				const afterY = point.y + (next.y - point.y) * rounding;
				if (index > 0) context.lineTo(beforeX, beforeY);
				context.quadraticCurveTo(point.x, point.y, afterX, afterY);
			});
			context.closePath();
		}

		shouldAnimate() {
			return !document.hidden;
		}

		updatePlayback() {
			if (this.shouldAnimate()) {
				if (!this.animationFrame) {
					this.lastTimestamp = 0;
					this.animationFrame = requestAnimationFrame(this.handleFrame);
				}
			} else {
				this.stopAnimation();
				this.renderFrame();
			}
		}

		stopAnimation() {
			cancelAnimationFrame(this.animationFrame);
			this.animationFrame = 0;
			this.lastTimestamp = 0;
		}

		handleVisibilityChange() {
			this.updatePlayback();
		}

		handlePointerEnter() {
			this.hoverTarget = 1;
		}

		handlePointerLeave() {
			this.hoverTarget = 0;
		}

		handleFocusIn() {
			this.handlePointerEnter();
		}

		handleFocusOut(event) {
			if (!this.card?.contains(event.relatedTarget)) {
				this.handlePointerLeave();
			}
		}
	}

	customElements.define("recommended-star-flow", RecommendedStarFlow);
}
