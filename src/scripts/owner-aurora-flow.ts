// 站长卡专属紫色特效：星尘上升 + 紫极光扫带（canvas web component）
// 在 FriendCard.astro 中通过 <owner-aurora-flow> 包装 <canvas> 使用
// 与推荐友链的金色 recommended-star-flow（横向流星）视觉区分：
//   · 粒子为四角星芒（sparkle），自底部缓缓上升并左右摇曳
//   · 光带为紫色极光，周期横扫，经过的星芒会被点亮放大

if (!customElements.get("owner-aurora-flow")) {
	class OwnerAuroraFlow extends HTMLElement {
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
				document.addEventListener("DOMContentLoaded", this.initialize, { once: true });
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
			this.canvas = this.querySelector(".friend-owner-canvas");
			this.context = this.canvas?.getContext("2d", { alpha: true }) || null;
			this.card = this.closest(".friend-card-link--own");

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
			document.addEventListener("visibilitychange", this.handleVisibilityChange);

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
			document.removeEventListener("visibilitychange", this.handleVisibilityChange);
			this.card?.removeEventListener("pointerenter", this.handlePointerEnter);
			this.card?.removeEventListener("pointerleave", this.handlePointerLeave);
			this.card?.removeEventListener("focusin", this.handleFocusIn);
			this.card?.removeEventListener("focusout", this.handleFocusOut);
			this.initialized = false;
		}

		createParticles() {
			let seed = 0x7e3fa9c1;
			const random = () => {
				seed = (seed * 1664525 + 1013904223) >>> 0;
				return seed / 4294967296;
			};
			const layerPattern = [0, 1, 0, 2, 1, 0, 2, 1, 0, 1, 2, 0, 1, 2];
			const xSlots = [0.08, 0.2, 0.33, 0.45, 0.57, 0.68, 0.8, 0.92, 0.14, 0.27, 0.4, 0.62, 0.74, 0.86];
			const layers = [
				{ radius: [2.4, 3.4], alpha: [0.38, 0.55], sway: [5, 10], glow: [3, 6] },
				{ radius: [3.4, 4.8], alpha: [0.55, 0.75], sway: [8, 14], glow: [6, 10] },
				{ radius: [4.8, 6.8], alpha: [0.75, 0.98], sway: [11, 19], glow: [10, 15] },
			];
			const between = (range) => range[0] + (range[1] - range[0]) * random();

			return Array.from({ length: 14 }, (_, index) => {
				const layer = layerPattern[index];
				const profile = layers[layer];
				return {
					index,
					layer,
					phase: random(),
					baseX: xSlots[index],
					radius: between(profile.radius),
					baseAlpha: between(profile.alpha),
					swayAmplitude: between(profile.sway),
					swayFrequency: 0.5 + random() * 0.6,
					swayPhase: random() * Math.PI * 2,
					riseSpeed: 0.75 + random() * 0.5 + layer * 0.12,
					glow: between(profile.glow),
					rotation: random() * Math.PI * 2,
					spinSpeed: (0.25 + random() * 0.35) * (random() > 0.5 ? 1 : -1),
					pulsePhase: random() * Math.PI * 2,
					pulseSpeed: 0.9 + random() * 1.1,
					tailScale: 2.4 + random() * 1.4 + layer * 0.6,
					hasTrail: layer > 0 || index % 4 === 0,
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
			const speed = 1 + this.hoverAmount * 0.16;
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
			const cycleDuration = 7200;
			const bandDuration = 5200;
			const bandProgress = (this.elapsed % bandDuration) / bandDuration;
			const easedBand = bandProgress * bandProgress * (3 - 2 * bandProgress);
			const bandX = (-0.18 + easedBand * 1.36) * this.width;
			const bandSpread = Math.max(26, this.width * 0.16);

			for (const particle of this.particles) {
				const progress =
					(particle.phase +
						(this.elapsed / cycleDuration) * particle.riseSpeed) %
					1;
				const radius = particle.radius;
				const enterFade = smooth01(progress / 0.18);
				const exitFade = smooth01((1 - progress) / 0.24);
				const edgeFade = enterFade * exitFade;

				const rawY = this.height * (1.1 - progress * 1.2);
				const y = Math.max(radius + 2, Math.min(this.height - radius - 2, rawY));
				const rawX =
					particle.baseX * this.width +
					Math.sin(time * particle.swayFrequency + particle.swayPhase) *
						particle.swayAmplitude;
				const x = Math.max(radius, Math.min(this.width - radius, rawX));

				const bandDistance = x - bandX;
				const bandBoost = Math.exp(
					-(bandDistance * bandDistance) / (2 * bandSpread * bandSpread),
				);
				const pulse =
					0.88 +
					Math.sin(time * particle.pulseSpeed + particle.pulsePhase) * 0.12;
				const scale =
					0.9 + pulse * 0.1 + bandBoost * 0.3 + this.hoverAmount * 0.1;
				const alpha = Math.min(
					1,
					particle.baseAlpha *
						edgeFade *
						(pulse + bandBoost * 0.42 + this.hoverAmount * 0.14),
				);
				const rotation = particle.rotation + time * particle.spinSpeed;

				if (particle.hasTrail && alpha > 0.05) {
					this.drawTrail(context, particle, x, y, radius * scale, alpha, bandBoost);
				}
				if (alpha > 0.02) {
					this.drawSparkle(context, particle, x, y, radius * scale, rotation, alpha, bandBoost);
				}
			}
		}

		drawTrail(context, particle, x, y, radius, alpha, bandBoost) {
			// 上升粒子身后的渐隐紫色尾迹
			const tailLength = radius * particle.tailScale;
			const swayOffset =
				Math.sin((y / Math.max(this.height, 1)) * Math.PI * 2 + particle.swayPhase) *
				(tailLength * 0.22);
			const gradient = context.createLinearGradient(x + swayOffset, y + tailLength, x, y);
			gradient.addColorStop(0, "rgba(165, 148, 255, 0)");
			gradient.addColorStop(
				1,
				`rgba(178, 160, 255, ${Math.min(0.6, alpha * (0.4 + bandBoost * 0.2))})`,
			);

			context.save();
			context.globalCompositeOperation = "source-over";
			context.strokeStyle = gradient;
			context.lineWidth = Math.max(0.8, radius * 0.4);
			context.lineCap = "round";
			context.shadowColor = `rgba(141, 124, 255, ${0.3 + bandBoost * 0.28})`;
			context.shadowBlur = 4 + bandBoost * 6;
			context.beginPath();
			context.moveTo(x + swayOffset, y + tailLength);
			context.quadraticCurveTo(
				x + swayOffset * 0.4,
				y + tailLength * 0.45,
				x,
				y + radius * 0.6,
			);
			context.stroke();
			context.restore();
		}

		drawSparkle(context, particle, x, y, radius, rotation, alpha, bandBoost) {
			const fillColors = ["214, 205, 255", "178, 160, 255", "141, 124, 255"];
			const fill = fillColors[particle.layer];

			context.save();
			context.translate(x, y);
			context.globalCompositeOperation = "source-over";
			context.shadowColor = `rgba(141, 124, 255, ${0.5 + bandBoost * 0.34})`;
			context.shadowBlur = particle.glow + bandBoost * 11 + this.hoverAmount * 3;

			// 四角星芒主体
			this.traceRoundedStar(context, radius, rotation, 0.14, 4);
			const gradient = context.createRadialGradient(0, 0, 0, 0, 0, radius);
			gradient.addColorStop(0, `rgba(245, 242, 255, ${Math.min(1, alpha + 0.25)})`);
			gradient.addColorStop(0.55, `rgba(${fill}, ${alpha})`);
			gradient.addColorStop(1, `rgba(${fill}, ${alpha * 0.72})`);
			context.fillStyle = gradient;
			context.fill();
			context.strokeStyle = `rgba(235, 230, 255, ${Math.min(1, alpha + 0.18)})`;
			context.lineWidth = 0.6 + particle.layer * 0.16;
			context.stroke();

			// 十字光芒（细长闪光线，营造"星光"质感）
			const flareLength = radius * (2.1 + bandBoost * 1.2);
			const flareAlpha = alpha * (0.34 + bandBoost * 0.3);
			context.rotate(rotation);
			context.strokeStyle = `rgba(226, 218, 255, ${flareAlpha})`;
			context.lineWidth = Math.max(0.6, radius * 0.16);
			context.lineCap = "round";
			context.beginPath();
			context.moveTo(-flareLength, 0);
			context.lineTo(flareLength, 0);
			context.moveTo(0, -flareLength);
			context.lineTo(0, flareLength);
			context.stroke();
			context.restore();
		}

		traceRoundedStar(context, outerRadius, rotation, rounding, points) {
			const innerRadius = outerRadius * 0.36;
			const total = points * 2;
			const vertices = Array.from({ length: total }, (_, index) => {
				const radius = index % 2 === 0 ? outerRadius : innerRadius;
				const angle = rotation - Math.PI / 2 + (index * Math.PI) / points;
				return {
					x: Math.cos(angle) * radius,
					y: Math.sin(angle) * radius,
				};
			});
			const first = vertices[0];
			const last = vertices[vertices.length - 1];

			context.beginPath();
			context.moveTo(
				first.x + (last.x - first.x) * rounding,
				first.y + (last.y - first.y) * rounding,
			);

			vertices.forEach((point, index) => {
				const previous = vertices[(index + vertices.length - 1) % vertices.length];
				const next = vertices[(index + 1) % vertices.length];
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

	function smooth01(t) {
		const clamped = Math.max(0, Math.min(1, t));
		return clamped * clamped * (3 - 2 * clamped);
	}

	customElements.define("owner-aurora-flow", OwnerAuroraFlow);
}
