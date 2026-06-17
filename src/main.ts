/**
 * Pomodoro Calendar Plugin for Obsidian
 * Main Plugin Entry Point
 */

import { Plugin, Notice, addIcon } from 'obsidian';
import { PomodoroTimer, PomodoroSession, PomodoroType } from './pomodoro';
import { PomodoroAnimatedBar } from './animatedBar';
import { PomodoroSettingsTab, PomodoroCalendarSettings, DEFAULT_SETTINGS } from './settings';
import { CalendarIntegration } from './calendarIntegration';
import { PomodoroDataStore, StoredData } from './dataStore';

// Register custom icon
const POMODORO_ICON = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
	<circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" stroke-width="8"/>
	<path d="M50 25 L50 50 L70 50" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>
	<circle cx="50" cy="50" r="3" fill="currentColor"/>
</svg>`;

export default class PomodoroCalendarPlugin extends Plugin {
	settings!: PomodoroCalendarSettings;
	dataStore!: PomodoroDataStore;
	calendarIntegration!: CalendarIntegration;
	pomodoroTimer!: PomodoroTimer;
	ribbonIcon!: HTMLElement;
	animatedBar: PomodoroAnimatedBar | null = null;
	pluginId = 'pomodoro-calendar';

	async onload() {
		console.log('Loading Pomodoro Calendar Plugin');

		// Register custom icon
		addIcon('pomodoro-icon', POMODORO_ICON);

		// Load settings
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

		// Initialize data store
		const dataPath = '.obsidian/plugins/pomodoro-calendar/data.json';
		this.dataStore = new PomodoroDataStore(this.app, dataPath);
		await this.dataStore.init();

		// Initialize calendar integration
		this.calendarIntegration = new CalendarIntegration(this.app);

		// Initialize pomodoro timer
		this.pomodoroTimer = new PomodoroTimer(this.settings, {
			onStart: this.onPomodoroStart.bind(this),
			onPause: this.onPomodoroPause.bind(this),
			onResume: this.onPomodoroResume.bind(this),
			onComplete: this.onPomodoroComplete.bind(this),
			onCancel: this.onPomodoroCancel.bind(this),
			onTick: this.onPomodoroTick.bind(this)
		});

		// Load CSS styles
		this.loadPluginStyles();

		// Create ribbon icon
		this.createRibbonIcon();

		// Create floating progress bar
		this.animatedBar = new PomodoroAnimatedBar(this.app);

		// Register floating bar action callbacks
		this.animatedBar.onAction((action) => {
			this.handleFloatingBarAction(action);
		});

		// Register settings tab
		this.addSettingTab(new PomodoroSettingsTab(this.app, this));

		// Register commands
		this.registerCommands();

		// Register events
		this.registerEvents();

		// Initialize calendar integration if enabled
		if (this.settings.enableCalendarIntegration) {
			await this.initCalendarIntegration();
		}

		// Register for external data sync
		this.dataStore.onSync(this.onDataSync.bind(this));

		// Load any existing session from storage
		await this.restoreSession();

		console.log('Pomodoro Calendar Plugin loaded successfully');
	}

	onunload() {
		console.log('Unloading Pomodoro Calendar Plugin');

		// Clean up
		this.animatedBar?.destroy();
		this.pomodoroTimer?.destroy();
		this.calendarIntegration?.destroy();
		this.dataStore?.destroy();

		// Remove ribbon icon
		if (this.ribbonIcon) {
			this.ribbonIcon.remove();
		}
	}

	/**
	 * Load plugin CSS styles
	 */
	private loadPluginStyles(): void {
		// Inject CSS directly since the file path might not work
		const cssContent = `
/* Pomodoro Calendar Plugin Styles */
.pomodoro-ribbon-icon { position: relative; color: var(--text-muted, #888) !important; }
.pomodoro-ribbon-icon svg { width: 20px; height: 20px; stroke: currentColor; }
.pomodoro-ribbon-icon:hover { color: var(--text-normal, #ddd) !important; }
.pomodoro-ribbon-icon.pomodoro-idle { opacity: 0.8; }
.pomodoro-ribbon-icon.pomodoro-running { opacity: 1; color: var(--text-accent, #7ee787) !important; animation: pulse-icon 1.5s ease-in-out infinite; }
.pomodoro-ribbon-icon.pomodoro-paused { opacity: 0.5; color: var(--text-muted, #666) !important; }
@keyframes pulse-icon { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }

.pomodoro-floating-bar { position: fixed; left: 0; right: 0; bottom: -90px; height: 60px; background: var(--background-secondary, #1e1e1e); border-top: 2px solid var(--background-modifier-border, #333); display: flex; flex-direction: column; z-index: 1000; transition: bottom 0.3s ease; box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3); }
.pomodoro-floating-bar.pomodoro-visible { bottom: 30px; }
.pomodoro-floating-content { display: flex; align-items: center; gap: 16px; padding: 12px 20px; flex: 1; }
.pomodoro-floating-progress { position: absolute; top: 0; left: 0; right: 0; height: 4px; background: transparent; overflow: hidden; }
.pomodoro-rainbow-bg { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(to right, hsl(0, 70%, 60%), hsl(60, 70%, 60%), hsl(120, 70%, 60%), hsl(180, 70%, 60%), hsl(240, 70%, 60%), hsl(300, 70%, 60%)); animation: rainbow-shift 3s linear infinite; }
@keyframes rainbow-shift { 0% { filter: hue-rotate(0deg); } 100% { filter: hue-rotate(360deg); } }
.pomodoro-progress-fill { position: absolute; top: 0; left: 0; height: 100%; background: rgba(0, 0, 0, 0.4); transition: width 0.3s ease; }
.pomodoro-floating-icon { font-size: 20px; display: inline-flex; align-items: center; justify-content: center; }
.pomodoro-floating-bar.pomodoro-state-running .pomodoro-floating-icon { animation: bounce 0.5s ease infinite; }
@keyframes bounce { 0%, 100% { transform: translate(-50%, -50%) translateY(0); } 50% { transform: translateY(-3px); } }
.pomodoro-floating-timer { font-size: 24px; font-family: var(--font-monospace, monospace); font-weight: 700; min-width: 70px; text-align: center; color: var(--text-normal, #ddd); }
.pomodoro-floating-bar.pomodoro-state-running .pomodoro-floating-timer { color: var(--text-accent, #7ee787); }
.pomodoro-floating-label { font-size: 14px; color: var(--text-muted, #999); }
.pomodoro-floating-controls { display: flex; gap: 8px; margin-left: auto; }
.pomodoro-floating-btn { width: 40px; height: 40px; border: none; border-radius: 8px; background: var(--interactive-normal, #2a2a2a); color: var(--text-normal, #ddd); font-size: 16px; font-weight: bold; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; }
.pomodoro-floating-btn:hover { background: var(--interactive-hover, #3a3a3a); transform: scale(1.05); }
.pomodoro-floating-btn:active { transform: scale(0.95); }


/* Animated Progress Bar Styles */
.pomodoro-animated-bar {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 60px;
	height: 70px;
	background: transparent;
	display: none;
	flex-direction: column;
	justify-content: flex-end;
	z-index: 1000;
	opacity: 1;
	transition: opacity 0.3s ease;
	pointer-events: none;
}

.pomodoro-animated-bar.pomodoro-visible {
	opacity: 1;
	pointer-events: auto;
}

.pomodoro-animated-bg {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	height: 40px;
	background: transparent;
	margin: 0 8px;
}

.pomodoro-animated-controls {
	position: absolute;
	top: 2px;
	right: 12px;
	display: flex;
	gap: 6px;
	z-index: 10;
}

.pomodoro-animated-btn {
	width: 32px;
	height: 32px;
	border: none;
	border-radius: 6px;
	background: rgba(42, 42, 42, 0.8);
	color: var(--text-normal, #ddd);
	font-size: 14px;
	font-weight: bold;
	cursor: pointer;
	transition: all 0.15s ease;
	display: flex;
	align-items: center;
	justify-content: center;
	backdrop-filter: blur(4px);
}

.pomodoro-animated-btn:hover {
	background: rgba(58, 58, 58, 0.9);
	transform: scale(1.03);
}

.pomodoro-animated-btn:active {
	transform: scale(0.97);
}

.pomodoro-progress-trail {
	position: absolute;
	bottom: 4px;
	left: 12px;
	right: 12px;
	height: 12px;
	background: linear-gradient(to right, 
		hsl(0, 70%, 60%), 
		hsl(60, 70%, 60%), 
		hsl(120, 70%, 60%), 
		hsl(180, 70%, 60%), 
		hsl(240, 70%, 60%), 
		hsl(300, 70%, 60%)
	);
	border-radius: 6px;
	overflow: hidden;
}


.pomodoro-coin-track {
	position: absolute;
	bottom: 4px;
	left: 12px;
	right: 12px;
	height: 12px;
	background: transparent;
	border-radius: 6px;
	z-index: 15;
	pointer-events: none;
}

.pomodoro-track-coin {
	position: absolute;
	font-size: 11px;
	opacity: 0.8;
	transform: translate(-50%, -50%);
	filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.6));
}











@keyframes character-bounce {
	0%, 100% { transform: translate(-50%, -50%) translateY(0); }
	50% { transform: translate(-50%, -50%) translateY(-2px); }
}
@keyframes character-bounce {
	0%, 100% { transform: translate(-50%, -50%) translateY(0); }
	50% { transform: translate(-50%, -50%) translateY(-2px); }
}


.pomodoro-white-track {
	position: absolute;
	top: 0;
	left: 0;
	height: 100%;
	width: 0%;
	background: #ffffff;
	transition: width 0.3s ease;
	border-radius: 6px;
	box-shadow: 0 0 8px rgba(255, 255, 255, 0.8);
}

.pomodoro-character {
	position: absolute;
	bottom: 4px;
	left: 12px;
	height: 12px;
	width: calc(100% - 24px);
	z-index: 25;
	pointer-events: none;
	transition: none;
}

.pomodoro-character-white {
	position: absolute;
	top: 50%;
	left: 0;
	transform: translate(-50%, -50%);
	font-size: 24px;
	color: #ffffff;
	filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.8));
}

.pomodoro-character-gold {
	position: absolute;
	top: 50%;
	left: 0;
	transform: translate(-50%, -50%);
	font-size: 24px;
	color: #ffd700;
	opacity: 0;
	transition: opacity 0.3s ease;
	filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.9));
}

.pomodoro-animated-bar.pomodoro-state-running .pomodoro-character {
	animation: character-bounce 0.5s ease-in-out infinite;
}

@keyframes character-bounce {
	0%, 100% { transform: translateY(0); }
	50% { transform: translateY(-2px); }
}



.pomodoro-progress-text {
	position: absolute;
	top: 2px;
	left: 12px;
	display: flex;
	align-items: center;
	gap: 10px;
	font-family: var(--font-monospace, monospace);
}

.pomodoro-time-display {
	font-size: 16px;
	font-weight: 700;
	color: var(--text-accent, #7ee787);
}

.pomodoro-percent-display {
	font-size: 11px;
	color: var(--text-muted, #999);
	font-weight: 600;
}

.pomodoro-celebration-particle {
	position: absolute;
	font-size: 14px;
	animation: particle-fly 1.5s ease forwards;
	pointer-events: none;
	z-index: 30;
}

@keyframes particle-fly {
	0% { transform: translateY(0) scale(1); opacity: 1; }
	100% { transform: translateY(-60px) scale(0); opacity: 0; }
}

.pomodoro-animated-bar.pomodoro-completed {
	animation: celebrate-bar 0.6s ease;
}

@keyframes celebrate-bar {
	0%, 100% { transform: translateY(0); }
	50% { transform: translateY(-6px); }
}

.pomodoro-animated-bar.pomodoro-no-animations * {
	animation: none !important;
	transition: none !important;
}

/* Responsive adjustments for animated bar */
@media (max-width: 600px) {
	.pomodoro-animated-bar { bottom: 50px; height: 65px; }
	.pomodoro-animated-bg { height: 35px; }
	.pomodoro-progress-trail { bottom: 3px; left: 8px; right: 8px; height: 10px; }
	.pomodoro-animated-controls { top: 1px; right: 8px; }
	.pomodoro-animated-btn { width: 28px; height: 28px; font-size: 12px; }
	.pomodoro-character { font-size: 16px; }
	.pomodoro-track-coin { font-size: 9px; }
	.pomodoro-time-display { font-size: 14px; }
	.pomodoro-percent-display { font-size: 10px; }
}

.pomodoro-animated-bar.pomodoro-visible {
	opacity: 1;
	pointer-events: auto;
}

.pomodoro-animated-bg {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	height: 40px;
	background: transparent;
	margin: 0 8px;
}

.pomodoro-animated-controls {
	position: absolute;
	top: 2px;
	right: 12px;
	display: flex;
	gap: 6px;
	z-index: 10;
}

.pomodoro-animated-btn {
	width: 32px;
	height: 32px;
	border: none;
	border-radius: 6px;
	background: rgba(42, 42, 42, 0.8);
	color: var(--text-normal, #ddd);
	font-size: 14px;
	font-weight: bold;
	cursor: pointer;
	transition: all 0.15s ease;
	display: flex;
	align-items: center;
	justify-content: center;
	backdrop-filter: blur(4px);
}

.pomodoro-animated-btn:hover {
	background: rgba(58, 58, 58, 0.9);
	transform: scale(1.03);
}

.pomodoro-animated-btn:active {
	transform: scale(0.97);
}

.pomodoro-progress-trail {
	position: absolute;
	bottom: 4px;
	left: 12px;
	right: 12px;
	height: 12px;
	background: rgba(0, 0, 0, 0.2);
	border-radius: 6px;
	overflow: hidden;
}


.pomodoro-track-coin {
	position: absolute;
	font-size: 9px;
	opacity: 0.4;
	color: #fff;
	text-shadow: 0 0 1px rgba(0, 0, 0, 0.8);
	transform: translate(-50%, -50%);
	pointer-events: none;
}








@keyframes character-bounce {
	0%, 100% { transform: translate(-50%, -50%) translateY(0); }
	50% { transform: translate(-50%, -50%) translateY(-2px); }
}

.pomodoro-progress-text {
	position: absolute;
	top: 2px;
	left: 12px;
	display: flex;
	align-items: center;
	gap: 10px;
	font-family: var(--font-monospace, monospace);
}

.pomodoro-time-display {
	font-size: 16px;
	font-weight: 700;
	color: var(--text-accent, #7ee787);
}

.pomodoro-percent-display {
	font-size: 11px;
	color: var(--text-muted, #999);
	font-weight: 600;
}

.pomodoro-celebration-particle {
	position: absolute;
	font-size: 14px;
	animation: particle-fly 1.5s ease forwards;
	pointer-events: none;
	z-index: 25;
}

@keyframes particle-fly {
	0% { transform: translateY(0) scale(1); opacity: 1; }
	100% { transform: translateY(-60px) scale(0); opacity: 0; }
}

.pomodoro-animated-bar.pomodoro-completed {
	animation: celebrate-bar 0.6s ease;
}

@keyframes celebrate-bar {
	0%, 100% { transform: translate(-50%, -50%) translateY(0); }
	50% { transform: translateY(-6px); }
}

.pomodoro-animated-bar.pomodoro-no-animations * {
	animation: none !important;
	transition: none !important;
}

/* Responsive adjustments for animated bar */
@media (max-width: 600px) {
	.pomodoro-animated-bar { bottom: 50px; height: 65px; }
	.pomodoro-animated-bg { height: 35px; }
	.pomodoro-progress-trail { bottom: 3px; left: 8px; right: 8px; height: 10px; }
	.pomodoro-animated-controls { top: 1px; right: 8px; }
	.pomodoro-animated-btn { width: 28px; height: 28px; font-size: 12px; }
	.pomodoro-character { font-size: 16px; }
	.pomodoro-track-coin { font-size: 8px; }
	.pomodoro-time-display { font-size: 14px; }
	.pomodoro-percent-display { font-size: 10px; }
}
.pomodoro-animated-bar.pomodoro-visible {
	opacity: 1;
	pointer-events: auto;
}

.pomodoro-animated-bg {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	height: 40px;
	background: transparent;
	margin: 0 8px;
}

.pomodoro-animated-controls {
	position: absolute;
	top: 2px;
	right: 12px;
	display: flex;
	gap: 6px;
	z-index: 10;
}

.pomodoro-animated-btn {
	width: 32px;
	height: 32px;
	border: none;
	border-radius: 6px;
	background: rgba(42, 42, 42, 0.8);
	color: var(--text-normal, #ddd);
	font-size: 14px;
	font-weight: bold;
	cursor: pointer;
	transition: all 0.15s ease;
	display: flex;
	align-items: center;
	justify-content: center;
	backdrop-filter: blur(4px);
}

.pomodoro-animated-btn:hover {
	background: rgba(58, 58, 58, 0.9);
	transform: scale(1.03);
}

.pomodoro-animated-btn:active {
	transform: scale(0.97);
}

.pomodoro-progress-trail {
	position: absolute;



.pomodoro-animated-bar.pomodoro-state-running .pomodoro-character .pomodoro-character-inner {
	animation: star-run 0.5s ease-in-out infinite;
}

@keyframes star-run {
	0%, 100% { transform: translate(-50%, -50%) translateY(0); }
	50% { transform: translate(-50%, -50%) translateY(-2px); }
}
	bottom: 4px;
	left: 12px;
	right: 12px;
	height: 12px;
	background: rgba(0, 0, 0, 0.2);
	border-radius: 6px;
	overflow: hidden;
}


.pomodoro-track-coin {
	position: absolute;
	font-size: 9px;
	opacity: 0.3;
	color: #fff;
	text-shadow: 0 0 1px rgba(0, 0, 0, 0.8);
	transform: translate(-50%, -50%);
	pointer-events: none;
}




@keyframes star-run {
	0%, 100% { transform: translate(-50%, -50%) translateY(0); }
	50% { transform: translate(-50%, -50%) translateY(-1px); }
}

.pomodoro-progress-text {
	position: absolute;
	top: 2px;
	left: 12px;
	display: flex;
	align-items: center;
	gap: 10px;
	font-family: var(--font-monospace, monospace);
}

.pomodoro-time-display {
	font-size: 16px;
	font-weight: 700;
	color: var(--text-accent, #7ee787);
}

.pomodoro-percent-display {
	font-size: 11px;
	color: var(--text-muted, #999);
	font-weight: 600;
}

.pomodoro-celebration-particle {
	position: absolute;
	font-size: 14px;
	animation: particle-fly 1.5s ease forwards;
	pointer-events: none;
	z-index: 20;
}

@keyframes particle-fly {
	0% { transform: translateY(0) scale(1); opacity: 1; }
	100% { transform: translateY(-60px) scale(0); opacity: 0; }
}

.pomodoro-animated-bar.pomodoro-completed .pomodoro-character {
	animation: star-celebrate 0.8s ease;
}

@keyframes star-celebrate {
	0%, 100% { transform: translate(-50%, -50%) scale(1); }
	50% { transform: translate(-50%, -50%) scale(1.3); }
}

.pomodoro-animated-bar.pomodoro-no-animations * {
	animation: none !important;
	transition: none !important;
}

/* Responsive adjustments for animated bar */
@media (max-width: 600px) {
	.pomodoro-animated-bar { bottom: 50px; height: 65px; }
	.pomodoro-animated-bg { height: 35px; }
	.pomodoro-progress-trail { bottom: 3px; left: 8px; right: 8px; height: 10px; }
	.pomodoro-animated-controls { top: 1px; right: 8px; }
	.pomodoro-animated-btn { width: 28px; height: 28px; font-size: 12px; }
	.pomodoro-character { font-size: 14px; }
	.pomodoro-track-coin { font-size: 8px; }
	.pomodoro-time-display { font-size: 14px; }
	.pomodoro-percent-display { font-size: 10px; }
}
	animation: star-glow 1.5s ease-in-out infinite;
}

@keyframes star-glow {
	0%, 100% { filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.9)) drop-shadow(0 0 4px #ffd700); }
	50% { filter: drop-shadow(0 0 12px rgba(255, 255, 255, 1)) drop-shadow(0 0 6px #ffd700); }
}


@keyframes star-run {
	0%, 100% { transform: translate(-50%, -50%) rotate(-8deg) translateY(0); }
	50% { transform: translate(-50%, -50%) rotate(8deg) translateY(-2px); }
}

.pomodoro-progress-text {
	position: absolute;
	top: 6px;
	left: 16px;
	display: flex;
	align-items: center;
	gap: 12px;
	font-family: var(--font-monospace, monospace);
}

.pomodoro-time-display {
	font-size: 18px;
	font-weight: 700;
	color: var(--text-accent, #7ee787);
	text-shadow: 0 0 8px rgba(126, 231, 135, 0.3);
}

.pomodoro-percent-display {
	font-size: 12px;
	color: var(--text-muted, #999);
	font-weight: 600;
}

.pomodoro-celebration-particle {
	position: absolute;
	font-size: 16px;
	animation: particle-fly 2s ease forwards;
	pointer-events: none;
	z-index: 20;
}

@keyframes particle-fly {
	0% { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; }
	100% { transform: translateY(-80px) scale(0) rotate(360deg); opacity: 0; }
}

.pomodoro-animated-bar.pomodoro-completed .pomodoro-white-track {
	animation: track-complete 0.8s ease forwards;
}

@keyframes track-complete {
	0% { background: linear-gradient(to right, rgba(255, 255, 255, 0.95), rgba(240, 240, 240, 0.9)); }
	50% { background: linear-gradient(to right, #ffd700, #fff, #ffd700); }
	100% { background: linear-gradient(to right, rgba(255, 255, 255, 0.95), rgba(240, 240, 240, 0.9)); }
}

.pomodoro-animated-bar.pomodoro-completed {
	animation: celebrate-bar 0.6s ease;
}

@keyframes celebrate-bar {
	0%, 100% { transform: translate(-50%, -50%) translateY(0); }
	50% { transform: translateY(-6px); }
}

.pomodoro-animated-bar.pomodoro-no-animations * {
	animation: none !important;
	transition: none !important;
}

/* Responsive adjustments for animated bar */
@media (max-width: 600px) {
	.pomodoro-animated-bar { bottom: 50px; height: 75px; }
	.pomodoro-animated-bg { height: 40px; margin: 0 4px; }
	.pomodoro-progress-trail { bottom: 6px; left: 10px; right: 10px; height: 16px; }
	.pomodoro-animated-controls { top: 4px; right: 10px; }
	.pomodoro-animated-btn { width: 32px; height: 32px; font-size: 14px; }
	.pomodoro-character { font-size: 16px; }
	.pomodoro-track-coin { font-size: 10px; }
	.pomodoro-time-display { font-size: 16px; }
	.pomodoro-percent-display { font-size: 11px; }
}
	right: 0;
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 16px;
	font-family: var(--font-monospace, monospace);
}

.pomodoro-time-display {
	font-size: 24px;
	font-weight: 700;
	color: var(--text-accent, #7ee787);
	text-shadow: 0 0 10px rgba(126, 231, 135, 0.3);
}

.pomodoro-percent-display {
	font-size: 14px;
	color: var(--text-muted, #999);
	font-weight: 600;
}

.pomodoro-celebration-particle {
	position: absolute;
	font-size: 24px;
	animation: particle-fly 2s ease forwards;
	pointer-events: none;
	z-index: 20;
}

@keyframes particle-fly {
	0% { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; }
	100% { transform: translateY(-120px) scale(0) rotate(360deg); opacity: 0; }
}

.pomodoro-animated-bar.pomodoro-completed {
	animation: celebrate-bar 0.8s ease;
}

@keyframes celebrate-bar {
	0%, 100% { transform: translate(-50%, -50%) translateY(0); }
	25% { transform: translateY(-8px); }
	50% { transform: translateY(-12px); }
	75% { transform: translateY(-8px); }
}

.pomodoro-animated-bar.pomodoro-no-animations * {
	animation: none !important;
	transition: none !important;
}

/* Responsive adjustments for animated bar */
@media (max-width: 600px) {
	.pomodoro-animated-bar { bottom: 50px; height: 120px; }
	.pomodoro-animated-bg { height: 70px; margin: 0 5px; }
	.pomodoro-progress-trail { height: 40px; margin: 30px 10px 8px; }
	.pomodoro-animated-controls { top: 8px; right: 10px; }
	.pomodoro-animated-btn { width: 38px; height: 38px; font-size: 16px; }
	.pomodoro-character { font-size: 24px; top: -6px; }
	.pomodoro-item { font-size: 16px; }
	.pomodoro-time-display { font-size: 20px; }
	.pomodoro-percent-display { font-size: 12px; }
}
`;
		const styleEl = document.createElement('style');
		styleEl.textContent = cssContent;
		styleEl.id = `${this.pluginId}-styles}`;
		document.head.appendChild(styleEl);
	}

	/**
	 * Create ribbon icon in left sidebar
	 */
	private createRibbonIcon(): void {
		console.log('Creating ribbon icon...');

		this.ribbonIcon = this.addRibbonIcon(
			'pomodoro-icon',  // Use the registered icon ID
			'番茄钟',
			(evt: MouseEvent) => {
				console.log('Ribbon icon clicked!');
				this.toggleFloatingBar();
			}
		);

		// Add custom class
		this.ribbonIcon.addClass('pomodoro-ribbon-icon');

		// Set initial state
		this.updateRibbonIcon();

		console.log('Ribbon icon created:', this.ribbonIcon);
	}

	/**
	 * Update ribbon icon appearance based on timer state
	 */
	private updateRibbonIcon(): void {
		const session = this.pomodoroTimer.getSession();

		// Remove all state classes
		this.ribbonIcon.removeClass('pomodoro-idle');
		this.ribbonIcon.removeClass('pomodoro-running');
		this.ribbonIcon.removeClass('pomodoro-paused');

		if (!session || session.state === 'idle') {
			this.ribbonIcon.addClass('pomodoro-idle');
		} else if (session.state === 'running') {
			this.ribbonIcon.addClass('pomodoro-running');
		} else if (session.state === 'paused') {
			this.ribbonIcon.addClass('pomodoro-paused');
		}
	}

	/**
	 * Toggle floating bar visibility
	 */
	private toggleFloatingBar(): void {
		console.log('Toggle floating bar clicked');
		if (!this.animatedBar) {
			console.error('Floating bar not initialized!');
			return;
		}

		if (this.animatedBar.getVisibility()) {
			console.log('Hiding floating bar');
			this.animatedBar.hide();
		} else {
			console.log('Showing floating bar');
			this.animatedBar.show();
			// Update the floating bar with current session
			this.animatedBar.update(this.pomodoroTimer.getSession());
		}
	}

	/**
	 * Register plugin commands
	 */
	private registerCommands(): void {
		// Start Pomodoro
		this.addCommand({
			id: 'start-pomodoro',
			name: '开始番茄钟',
			icon: 'pomodoro-icon',
			callback: () => {
				this.startPomodoro();
			}
		});

		// Start Short Break
		this.addCommand({
			id: 'start-short-break',
			name: '开始小休',
			callback: () => {
				this.startBreak('shortBreak');
			}
		});

		// Start Long Break
		this.addCommand({
			id: 'start-long-break',
			name: '开始长休',
			callback: () => {
				this.startBreak('longBreak');
			}
		});

		// Pause/Resume
		this.addCommand({
			id: 'toggle-pomodoro',
			name: '暂停/继续',
			callback: () => {
				this.togglePause();
			}
		});

		// Complete
		this.addCommand({
			id: 'complete-pomodoro',
			name: '完成番茄钟',
			callback: () => {
				this.completePomodoro();
			}
		});

		// Cancel
		this.addCommand({
			id: 'cancel-pomodoro',
			name: '取消番茄钟',
			callback: () => {
				this.cancelPomodoro();
			}
		});

		// Toggle floating bar
		this.addCommand({
			id: 'toggle-pomodoro-bar',
			name: '显示/隐藏番茄钟面板',
			callback: () => {
				this.toggleFloatingBar();
			}
		});
	}

	/**
	 * Register event handlers
	 */
	private registerEvents(): void {
		// Register workspace layout change for potential plugin updates
		this.registerEvent(
			this.app.workspace.on('layout-change', () => {
				// Try to initialize calendar integration if not already done
				if (this.settings.enableCalendarIntegration && !this.calendarIntegration.isAvailable()) {
					this.initCalendarIntegration();
				}
			})
		);
	}

	/**
	 * Handle floating bar actions
	 */
	private handleFloatingBarAction(action: string): void {
		switch (action) {
			case 'toggle':
				this.togglePause();
				break;
			case 'complete':
				this.completePomodoro();
				break;
			case 'cancel':
				this.cancelPomodoro();
				break;
			case 'menu':
				// Could open a settings menu here
				break;
		}
	}

	/**
	 * Initialize calendar integration
	 */
	async initCalendarIntegration(): Promise<boolean> {
		const success = await this.calendarIntegration.init();

		if (success) {
			new Notice('✅ 已连接到 Full Calendar Remastered');
		}

		return success;
	}

	/**
	 * Restore session from data store
	 */
	async restoreSession(): Promise<void> {
		const storedSession = this.dataStore.getCurrentSession();

		if (storedSession && storedSession.state === 'running') {
			// Calculate remaining time
			const startTime = new Date(storedSession.startTime!);
			const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
			const remaining = Math.max(0, storedSession.remaining - elapsed);

			if (remaining > 0) {
				// Restore the session
				const session = this.pomodoroTimer.start(storedSession.type);
				session.remaining = remaining;
				session.id = storedSession.id;

				// Show floating bar
				this.animatedBar?.show();
				this.animatedBar?.update(session);

				// Update calendar if event exists
				if (storedSession.eventId && storedSession.calendarId) {
					// Restore the calendar event reference
				}

				this.updateRibbonIcon();
				new Notice('🔄 已恢复之前的番茄钟会话');
			} else {
				// Session expired, clear it
				await this.dataStore.saveCurrentSession(null);
			}
		}
	}

	/**
	 * Start a new pomodoro
	 */
	startPomodoro(): void {
		const session = this.pomodoroTimer.start('pomodoro');

		// Show and update floating bar
		this.animatedBar?.show();
		this.animatedBar?.update(session);

		this.updateRibbonIcon();

		if (this.settings.showNotifications) {
			new Notice('🍅 开始专注！');
		}

		// Create calendar event
		if (this.settings.enableCalendarIntegration && this.settings.defaultCalendarId) {
			this.calendarIntegration.createPomodoroEvent(
				session,
				this.settings.defaultCalendarId
			).then((eventId) => {
				if (eventId) {
					console.log('Created calendar event:', eventId);
				}
			});
		}

		// Save to data store
		this.dataStore.saveCurrentSession(session, this.settings.defaultCalendarId);
	}

	/**
	 * Start a break
	 */
	startBreak(type: PomodoroType): void {
		const session = this.pomodoroTimer.start(type);

		// Show and update floating bar
		this.animatedBar?.show();
		this.animatedBar?.update(session);

		this.updateRibbonIcon();

		const emoji = type === 'shortBreak' ? '☕' : '🌴';
		const message = type === 'shortBreak' ? '休息一下' : '长休时间';
		new Notice(emoji + " " + message + "!");

		// Create calendar event
		if (this.settings.enableCalendarIntegration && this.settings.defaultCalendarId) {
			this.calendarIntegration.createPomodoroEvent(
				session,
				this.settings.defaultCalendarId
			);
		}

		// Save to data store
		this.dataStore.saveCurrentSession(session, this.settings.defaultCalendarId);
	}

	/**
	 * Pause the current pomodoro
	 */
	pausePomodoro(): void {
		this.pomodoroTimer.pause();

		this.animatedBar?.update(this.pomodoroTimer.getSession());
		this.updateRibbonIcon();

		if (this.settings.showNotifications) {
			new Notice('⏸️ 已暂停');
		}

		// Save to data store
		const session = this.pomodoroTimer.getSession();
		if (session) {
			this.dataStore.saveCurrentSession(session, this.settings.defaultCalendarId);
		}
	}

	/**
	 * Resume the paused pomodoro
	 */
	resumePomodoro(): void {
		this.pomodoroTimer.resume();

		this.animatedBar?.update(this.pomodoroTimer.getSession());
		this.updateRibbonIcon();

		if (this.settings.showNotifications) {
			new Notice('▶️ 继续专注！');
		}

		// Save to data store
		const session = this.pomodoroTimer.getSession();
		if (session) {
			this.dataStore.saveCurrentSession(session, this.settings.defaultCalendarId);
		}
	}

	/**
	 * Toggle pause/resume
	 */
	togglePause(): void {
		const session = this.pomodoroTimer.getSession();

		if (!session) {
			this.startPomodoro();
		} else if (session.state === 'running') {
			this.pausePomodoro();
		} else if (session.state === 'paused') {
			this.resumePomodoro();
		}
	}

	/**
	 * Complete the current pomodoro (manual trigger)
	 */
	completePomodoro(): void {
		const session = this.pomodoroTimer.getSession();

		if (!session) return;

		// Trigger completion - the callback will handle everything
		this.pomodoroTimer.complete();
	}

	/**
	 * Cancel the current pomodoro
	 */
	cancelPomodoro(): void {
		this.pomodoroTimer.cancel();

		this.animatedBar?.hide();
		this.updateRibbonIcon();

		if (this.settings.showNotifications) {
			new Notice('❌ 已取消');
		}

		// Cancel calendar event
		if (this.settings.enableCalendarIntegration) {
			this.calendarIntegration.cancelPomodoroEvent();
		}

		// Clear from data store
		this.dataStore.saveCurrentSession(null);
	}

	/**
	 * Pomodoro timer callbacks
	 */
	private onPomodoroStart(session: PomodoroSession): void {
		console.log('Pomodoro started:', session);
	}

	private onPomodoroPause(session: PomodoroSession): void {
		console.log('Pomodoro paused:', session);
	}

	private onPomodoroResume(session: PomodoroSession): void {
		console.log('Pomodoro resumed:', session);
	}

	private onPomodoroComplete(session: PomodoroSession): void {
		console.log('Pomodoro completed:', session);

		// Update floating bar with completed session
		this.animatedBar?.update(session);
		this.animatedBar?.showCompletionAnimation();
		this.updateRibbonIcon();

		if (this.settings.showNotifications) {
			const emoji = session.type === 'pomodoro' ? '🍅' :
			              session.type === 'shortBreak' ? '☕' : '🌴';
			new Notice(emoji + " 完成!干得漂亮!");

			// Play sound if enabled
			if (this.settings.notificationSound) {
				this.playNotificationSound();
			}
		}

		// Update calendar event
		if (this.settings.enableCalendarIntegration && this.settings.defaultCalendarId) {
			this.calendarIntegration.completePomodoroEvent(
				session,
				this.settings.defaultCalendarId
			);
		}

		// Update statistics
		if (session.type === 'pomodoro') {
			this.dataStore.recordCompletedPomodoro(session.duration);
		}

		// Clear from data store
		this.dataStore.saveCurrentSession(null);

		// Auto-hide floating bar after a delay
		setTimeout(() => {
			const currentSession = this.pomodoroTimer.getSession();
			if (!currentSession) {
				this.animatedBar?.hide();
			}
		}, 3000);

		// Auto-start next if enabled
		if (session.type === 'pomodoro' && this.settings.autoStartBreak) {
			setTimeout(() => {
				this.startBreak('shortBreak');
			}, 1000);
		}
	}

	private onPomodoroCancel(session: PomodoroSession): void {
		console.log('Pomodoro cancelled:', session);
	}

	private onPomodoroTick(remaining: number, total: number): void {
		// Update floating bar
		this.animatedBar?.update(this.pomodoroTimer.getSession());

		// Update calendar event every 5 seconds
		if (this.settings.enableCalendarIntegration && remaining % 5 === 0) {
			const session = this.pomodoroTimer.getSession();
			if (session && this.settings.defaultCalendarId) {
				this.calendarIntegration.updatePomodoroEvent(
					session,
					this.settings.defaultCalendarId
				);
			}
		}

		// Save remaining time to data store periodically
		if (remaining % 10 === 0) {
			this.dataStore.updateSessionRemaining(remaining);
		}
	}

	/**
	 * Handle external data sync
	 */
	private onDataSync(data: StoredData): void {
		console.log('External data synced:', data);

		// Reload session if different
		const currentSession = this.pomodoroTimer.getSession();
		const externalSession = data.currentSession;

		if (externalSession && (!currentSession || currentSession.id !== externalSession.id)) {
			// Session changed from another device
			this.restoreSession();
		}
	}

	/**
	 * Update status bar style (called from settings)
	 */
	updateStatusBarStyle(): void {
		// Update floating bar style
		this.animatedBar?.updateStyle(this.settings.progressBarStyle, this.settings.solidColor);
	}

	/**
	 * Update animation state (called from settings)
	 */
	updateAnimationState(): void {
		this.animatedBar?.setAnimationsEnabled(this.settings.showAnimations);
	}

	/**
	 * Restart file sync (called from settings)
	 */
	restartFileSync(): void {
		// Data store handles sync interval internally
		console.log('File sync restarted with interval:', this.settings.syncInterval);
	}

	/**
	 * Get available calendars for settings
	 */
	getAvailableCalendars() {
		return this.calendarIntegration.getAvailableCalendars();
	}

	/**
	 * Play notification sound
	 */
	private playNotificationSound(): void {
		try {
			// Create audio element with a simple beep sound
			const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSmBzvLZiTQIGGi77eegTAMMKalf7blnEAo4kdezzXksBSRxze7YkoACFFi5eu+nWUUKQ5zg8L1vIAUngM/x24U0BBlm5Ozq2VlGkOc4PC9byAFJ4DN89uJNAgRYubrvtplFjlDnODwvG8gBSWAzfDbhTQEGGWt7OrJWQpQ5zhL39iMBJYDO8N2SRAgRYJnp6LNSEQpT5w78qY0HElhN5+z2kUECWGd6miq05ECUOcG/atkBxJQDeys9tGBAkhnemppt2RAkDnBv2rZA');
			audio.volume = 0.3;
			audio.play().catch(err => console.log('Could not play sound:', err));
		} catch (error) {
			console.log('Error playing sound:', error);
		}
	}

	/**
	 * Save settings to disk
	 */
	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
	}
