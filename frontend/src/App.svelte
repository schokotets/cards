<script>
	import marked from 'marked'

	let question
	let answershown = false

	let topics
	let selectedtopic

	function loadTopics() {
		return fetch('/topics')
			.then(response => response.json())
			.then(data => { topics = data } )
	}

	function loadQuestion() {
		answershown = false
		return fetch('/questions/random?topic='+selectedtopic+(question?'&currentid='+question.id:""))
			.then(response => response.json())
			.then(data => { question = data } )
	}

	function showAnswer() {
		answershown = true
	}

	function loadNewQuestions() {
		fetch('/questions/reload')
	}

	async function sendResult(correct) {
		await fetch('/questions/result', {
			method: "POST",
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				id: question.id,
				correct
			})
		})
		loadQuestion()
	}

	loadTopics().then(loadQuestion)
</script>

<div class="quiz">
<main>
	<h1>Karten lernen</h1>
	<button on:click={loadNewQuestions}>Neue Fragen laden</button>
	{#if topics && topics.length > 0}
	<select bind:value={selectedtopic} on:change={loadQuestion}>
		{#each topics as topic}
		<option value="{topic}">{topic}</option>
		{/each}
	</select>
	{/if}
	{#if question && Object.keys(question).length > 0}
	<div class="card">
		<p>{question.right} mal richtig, {question.wrong} mal falsch</p>
		<h2>{question.question}</h2>
		{#if answershown}
		<p>{@html marked(question.answer)}</p>
		{/if}
	</div>
	{/if}
</main>
<footer>
	{#if !answershown}
	<button on:click={showAnswer}>Antwort zeigen</button>
	{:else}
	<button on:click={sendResult.bind(this, false)}>✗ falsch</button>
	<button on:click={sendResult.bind(this, true)}>✓ richtig</button>
	{/if}
	<button class="next" on:click={loadQuestion}>überspringen</button>
</footer>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
	}

	.quiz {
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.next {
		float: right;
	}

	main {
		flex: 1;
		margin: 1em;
	}

	footer {
		margin: 1em;
		margin-bottom: 20vh;
	}
</style>
