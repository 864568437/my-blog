<script lang="ts">
import Icon from "@/components/common/Icon.svelte";
import { url } from "@/utils/url-utils";

interface SponsorMethod {
	name: string;
	icon?: string;
	qrCode?: string;
	link?: string;
	description?: string;
}

interface Props {
	enabledMethods: SponsorMethod[];
}

let { enabledMethods }: Props = $props();
</script>

{#if enabledMethods.length > 0}
	<div class="sponsor-qr-card__outer">
		<div class="sponsor-qr-card">
			<!-- 标题：❤ 赞助支持 -->
			<div class="sponsor-qr-card__header">
				<h3 class="sponsor-qr-card__title">
					<span class="sponsor-qr-card__heart">❤</span>
					赞助支持
				</h3>
			</div>

			<!-- 描述 -->
			<p class="sponsor-qr-card__subtitle">
				如果我的内容对你有帮助，欢迎通过以下方式赞助我，你的支持是我持续创作的动力！
			</p>

			<!-- 三列并排卡片 -->
			<div class="sponsor-grid">
				{#each enabledMethods as method (method.name)}
					<div class="sponsor-grid__card">
						<div class="sponsor-grid__head">
							{#if method.icon}
								<Icon icon={method.icon} class="sponsor-grid__icon" />
							{/if}
							<span class="sponsor-grid__name">{method.name}</span>
						</div>
						<p class="sponsor-grid__desc">
							{method.description || `使用 ${method.name} 扫码赞助`}
						</p>
						{#if method.qrCode}
							<div class="sponsor-grid__qr">
								<img
									src={url(method.qrCode)}
									alt={`${method.name} 扫码赞助`}
									class="sponsor-grid__qr-img"
									loading="lazy"
								/>
							</div>
						{:else if method.link}
							<div class="sponsor-grid__qr sponsor-grid__qr--link">
								<a
									href={method.link}
									target="_blank"
									rel="noopener noreferrer"
									class="sponsor-grid__link"
								>
									前往赞助
									<Icon icon="material-symbols:open-in-new" class="text-base" />
								</a>
							</div>
						{:else}
							<div class="sponsor-grid__qr sponsor-grid__qr--empty">
								<Icon icon="material-symbols:qr-code-scanner" class="text-3xl opacity-40" />
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</div>
{/if}
