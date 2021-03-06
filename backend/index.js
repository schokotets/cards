const fs = require("fs")
const util = require("util")
const exec = util.promisify(require("child_process").exec)

const Koa = require("koa")
const app = new Koa()

const bodyParser = require("koa-bodyparser")
app.use(bodyParser({
  enableTypes: ["json"]
}))

const serve = require('koa-static')
app.use(serve("../frontend/public"))

let questions = []

function parseQuestions(text) {
  let combined = text.split('\n\n').slice(1)
  let topic = ""
  let questions = []

  for (potentialpair of combined) {
		let split = potentialpair.split("\n")
    if(split.length == 1) {
      topic = split[0].slice(3)
    } else {
      let question = split[0].slice(5)
      let answer = split.slice(1).join("\n")
      questions.push({ question, answer, topic })
    }
  }
	return questions
}

function loadNewQuestions(newquestions) {
  newquestions.forEach(nq => {
    if (!questions.some(q => q.question == nq.question)){
      nq.id = questions.reduce((max, q) => q.id > max ? q.id : max,-1)+1
      nq.right = 0
      nq.wrong = 0
      questions.push(nq)
    } else {
      // update topic
      q = questions.filter(q => q.question == nq.question)[0]
      q.topic = nq.topic
    }
  })
  saveData()
}

function reloadQuestions() {
  return exec("./loadtextquestions.sh")
    .then(({stdout, stderr}) => {
      if (stderr) {
        return {
          status: "error",
          error: stderr
        }
      } else {
        loadNewQuestions(parseQuestions(stdout))
        return {
          status: "ok"
        }
      }
    })
}

function noteCorrect(id, correct) {
  for (q of questions) {
    if(q.id != id) continue
    if(correct){
      q.right = q.right + 1
    } else {
      q.wrong = q.wrong + 1
    }
  }
  saveData()
}

function questionScore(q) {
  if (q.right == 0) return 5
  else return q.wrong/q.right + 0.1
}

function randomQuestion(topic,currentid) {
  let questionmap = questions
    .map(q => { q.score = questionScore(q); return q })
  if (currentid && currentid != "undefined") {
    questionmap = questionmap.filter(q => q.id != currentid)
  }
  if (topic && topic != "undefined") {
    questionmap = questionmap.filter(q => q.topic == topic)
  }
  sum = questionmap.reduce((sum, q) => sum+q.score, 0)
  let scorelevel = Math.random()*sum
  let currentlevel = 0
  for (q of questionmap) {
    currentlevel += q.score
    if(currentlevel >= scorelevel)
      return q
  }
  return questions[questions.length-1]
}

function getTopics() {
  let topics = []
  for (q of questions) {
    if (!topics.includes(q.topic)) {
      topics.push(q.topic)
    }
  }
  return topics
}

loadData()

app.use(async ctx => {
    if (ctx.path == "/topics") {
      if (ctx.method == "GET") {
        ctx.body = getTopics()
      } else {
        ctx.throw(405, "method not allowed")
      }
    } else if (ctx.path == "/questions") {
      if (ctx.method == "GET") {
        ctx.body = questions
      } else {
        ctx.throw(405, "method not allowed")
      }
    } else if (ctx.path == "/questions/reload") {
      ctx.body = await reloadQuestions()
    } else if (ctx.path == "/questions/random") {
      if (ctx.method == "GET") {
        ctx.body = randomQuestion(ctx.request.query.topic, ctx.request.query.currentid)
      } else {
        ctx.throw(405, "method not allowed")
      }
    } else if (ctx.path == "/questions/result") {
      if (ctx.method == "POST") {
        if ("id" in ctx.request.body && "correct" in ctx.request.body) {
          noteCorrect(ctx.request.body.id, ctx.request.body.correct)
          ctx.body = { status: "ok" }
        }
      } else {
        ctx.throw(405, "method not allowed")
      }
    } else {
      ctx.throw(404, "page not found")
    }
})

app.listen(8099)
console.log("cards backend listening on :8099")

function saveData() {
  fs.writeFile("questions.json", JSON.stringify(questions), function (err,data) {
    if (err) {
      return console.log(err);
    }
    if (data) {
      console.log(data)
    }
  })
  console.log("saved data")
}

function loadData() {
  try {
    questions = JSON.parse(fs.readFileSync("questions.json", 'utf8'))
  } catch (err) {
    console.error(err)
    questions = []
  }
}
