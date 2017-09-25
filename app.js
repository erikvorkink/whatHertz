'use strict'

const { h, app } = hyperapp
/** @jsx h */


const PITCHES_PER_ROUND = 5

const EMPTY_ROUND = {
	currentQuestion: null, // text shown to user
	currentPitch: null, // "Bb"
	numCorrect: 0,
	numIncorrect: 0,
	pitches: [], // "F", "A", "D"
	responses: [], // "F", "G#"
}

// Options shown on the keyboard and chosen within a round.
// Must match the keys in AUDIO_SPRITES.x.sprite.
const PITCHES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B']

// For now all sprites have identical length/timing
const STANDARD_AUDIO_SPRITE = {
	'C': [0, 3500],
	'C#': [4000, 3500],
	'D': [8000, 3500],
	'Eb': [12000, 3500],
	'E': [16000, 3500],
	'F': [20000, 3500],
	'F#': [24000, 3500],
	'G': [28000, 3500],
	'G#': [32000, 3500],
	'A': [36000, 3500],
	'Bb': [40000, 3500],
	'B': [44000, 3500]
}

// Played using the Howler audio library
const AUDIO_SPRITES = {
	'epiano': {
		url: 'audio/sprites/epiano.mp3',
		sprite: STANDARD_AUDIO_SPRITE,
	},
	'piano': {
		url: 'audio/sprites/piano.mp3',
		sprite: STANDARD_AUDIO_SPRITE,
	},
	'bells': {
		url: 'audio/sprites/synth-bells.mp3',
		sprite: STANDARD_AUDIO_SPRITE,
	},
	'strings': {
		url: 'audio/sprites/synth-strings.mp3',
		sprite: STANDARD_AUDIO_SPRITE
	}
}

// Cheers, etc. to be played at the end of a round
const REACTION_SAMPLES = {
	cheering: [
		{ url: 'audio/freesoundeffects.com/cheer.mp3' }
	],
	applause: [
		{ url: 'audio/freesoundeffects.com/applause3.mp3' },
		{ url: 'audio/freesoundeffects.com/applause7.mp3' }
	],
	meh: [
		{ url: 'audio/freesoundeffects.com/applause8.mp3' },
		{ url: 'audio/freesoundeffects.com/applause10.mp3' }
	],
	booing: [
		{ url: 'audio/freesoundeffects.com/boohiss.mp3' },
		{ url: 'audio/freesoundeffects.com/boo3.mp3' },
		{ url: 'audio/freesoundeffects.com/boos3.mp3' }
	]
}

let spritePlayer = null

// Load the give audio sprite into the sprite player
let loadAudioSprite = (sprite) => {
	spritePlayer = new Howl({
		src: [sprite.url],
		sprite: sprite.sprite
	})
}

// Choose a reaction sample based on the % of questions answered correctly
let chooseReactionSample = (percentCorrect) => {
	let category
	if (percentCorrect === 100) {
		category = REACTION_SAMPLES.cheering
	} else if (percentCorrect >= 70) {
		category = REACTION_SAMPLES.applause
	} else if (percentCorrect >= 50) {
		category = REACTION_SAMPLES.meh
	} else {
		category = REACTION_SAMPLES.booing
	}
	// Choose random within the chosen category
	return (category.length > 0) ? category[Math.floor(Math.random() * category.length)] : null
}

// Play one of the pitches loaded up in the sprite player
let playPitch = (pitch) => {
	if (!spritePlayer) throw 'Invalid sprite player'
	spritePlayer.play(pitch)
}

// Play multiple pitches at once
let playChord = (pitches) => {
	pitches.forEach(pitch => playPitch(pitch))
}

// Play a given reaction sample
let playReaction = (reactionSample) => {
	playURL(reactionSample.url)
}

// Play an arbitrary audio file
let playURL = (url) => {
	let sound = new Howl({
		src: [url]
	})
	sound.play()
}

const InstrumentButtonWidget = ({ name, label, clickHandler }) =>
	<button onclick={e => clickHandler(name)}>{label}</button>

const KeyboardWidget = ({ clickHandler }) =>
	<svg xmlSpace="preserve" width="322px" height="240">
		{/* White keys */}
		<rect style={{ fill: 'white', stroke: 'black' }} x="0" y="0" width="46" height="240" onclick={e => clickHandler('C')} />
		<rect style={{ fill: 'white', stroke: 'black' }} x="46" y="0" width="46" height="240" onclick={e => clickHandler('D')} />
		<rect style={{ fill: 'white', stroke: 'black' }} x="92" y="0" width="46" height="240" onclick={e => clickHandler('E')} />
		<rect style={{ fill: 'white', stroke: 'black' }} x="138" y="0" width="46" height="240" onclick={e => clickHandler('F')} />
		<rect style={{ fill: 'white', stroke: 'black' }} x="184" y="0" width="46" height="240" onclick={e => clickHandler('G')} />
		<rect style={{ fill: 'white', stroke: 'black' }} x="230" y="0" width="46" height="240" onclick={e => clickHandler('A')} />
		<rect style={{ fill: 'white', stroke: 'black' }} x="276" y="0" width="46" height="240" onclick={e => clickHandler('B')} />

		{/* Black keys */}
		<rect style={{ fill: 'black', stroke: 'black' }} x="28.66666" y="0" width="26" height="160" onclick={e => clickHandler('C#')} />
		<rect style={{ fill: 'black', stroke: 'black' }} x="83.33332" y="0" width="26" height="160" onclick={e => clickHandler('Eb')} />
		<rect style={{ fill: 'black', stroke: 'black' }} x="164.5" y="0" width="26" height="160" onclick={e => clickHandler('F#')} />
		<rect style={{ fill: 'black', stroke: 'black' }} x="216.5" y="0" width="26" height="160" onclick={e => clickHandler('G#')} />
		<rect style={{ fill: 'black', stroke: 'black' }} x="269.5" y="0" width="26" height="160" onclick={e => clickHandler('Bb')} />
	</svg>

app({
	state: {
		instrument: 'epiano',
		previousScore: null,
		activeRound: EMPTY_ROUND,
		hasActiveRound: false
	},
	view: (state, actions) =>
		<main>
			<h1>What Hertz?</h1>

			<div style={{ display: state.hasActiveRound ? 'none' : 'block' }}>
				<hr />
				<InstrumentButtonWidget name="epiano" label="Electric Piano" clickHandler={actions.setInstrument} />
				<InstrumentButtonWidget name="piano" label="Piano" clickHandler={actions.setInstrument} />
				<InstrumentButtonWidget name="bells" label="Syth Bells" clickHandler={actions.setInstrument} />
				<InstrumentButtonWidget name="strings" label="Synth Strings" clickHandler={actions.setInstrument} />
				<hr />
			</div>

			<h5 style={{
				display: state.previousScore ? 'block' : 'none'
				}}>
				{state.previousScore}
			</h5>

			<div style={{ display: state.hasActiveRound ? 'block' : 'none' }}>

				<h3>{state.activeRound.currentQuestion}</h3>

				<button onclick={actions.playCurrentPitch}>Repeat Note</button>

				<KeyboardWidget clickHandler={actions.handleResponse} />

				<hr />

				Correct: {state.activeRound.numCorrect} - Incorrect: {state.activeRound.numIncorrect}

				<hr />

			</div>

			<button onclick={actions.startRound}>{state.hasActiveRound ? 'Reset' : 'Start'} Round</button>
		</main>,

	events: {
		load(state, actions) {
			// Load up the default instrument
			let sprite = AUDIO_SPRITES[state.instrument]
			loadAudioSprite(sprite)
		}
	},

	actions: {
		setInstrument: (state, actions, instrument) => {
			state.instrument = instrument

			let sprite = AUDIO_SPRITES[instrument]
			loadAudioSprite(sprite)

			playChord(['C', 'E', 'G', 'Bb'])
		},

		// Create a clean state
		resetRound: (state) => {
			state.activeRound = _.cloneDeep(EMPTY_ROUND);
			return state
		},

		// Choose questions and ask the first one
		startRound: (state, actions) => {
			state.previousScore = null
			actions.resetRound()

			// Choose random pitches to be used for this round
			while (state.activeRound.pitches.length < PITCHES_PER_ROUND) {
				let pitch = PITCHES[Math.floor(Math.random() * PITCHES.length)]
				if (state.activeRound.pitches.indexOf(pitch) === -1) {
					state.activeRound.pitches.push(pitch)
				}
			}
			state.hasActiveRound = true
			actions.advance(state)
			return state
		},

		// Ask the next question
		advance: (state, actions) => {
			let nextPitch = state.activeRound.pitches[state.activeRound.responses.length]
			if (nextPitch) {
				let num = state.activeRound.responses.length + 1
				state.activeRound.currentPitch = nextPitch
				state.activeRound.currentQuestion = `Question ${num}: Can you click ${nextPitch}?`
				actions.playCurrentPitch()
				return state
			}

			return actions.endRound(state)
		},

		// Finish up the round
		endRound: (state, actions) => {
			state.previousScore = `Your score is ${state.activeRound.numCorrect} / ${state.activeRound.pitches.length}`

			let percentCorrect = (state.activeRound.numCorrect / state.activeRound.pitches.length) * 100
			let reaction = chooseReactionSample(percentCorrect)
			reaction && playReaction(reaction)

			state.hasActiveRound = false
			return state
		},

		// Play the pitch of the current question
		playCurrentPitch: (state) => {
			if (state.activeRound.currentPitch) {
				playPitch(state.activeRound.currentPitch)
			}
		},

		// Called when the user presses a note on the keyboard to
		// indicate their answer
		handleResponse: (state, actions, responsePitch) => {
			state.activeRound.responses.push(responsePitch)
			if (responsePitch == state.activeRound.currentPitch) {
				state.activeRound.numCorrect++
			} else {
				state.activeRound.numIncorrect++
			}
			return actions.advance(state)
		}
	}
})