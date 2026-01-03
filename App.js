import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Pressable,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");
const GROUND_HEIGHT = 100;
const PLAYER_X = 60;

export default function App() {
  const [screen, setScreen] = useState("login");
  const [username, setUsername] = useState("");
  const [difficulty, setDifficulty] = useState(null);

  /* ================= LOGIN (UNCHANGED) ================= */
  if (screen === "login") {
    return (
      <View style={styles.loginContainer}>
        <Text style={styles.appTitle}>Stick Man Runner</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter Username"
          placeholderTextColor="#aaa"
          value={username}
          onChangeText={setUsername}
        />

        <TouchableOpacity
          style={[
            styles.loginButton,
            { opacity: username.length < 3 ? 0.5 : 1 },
          ]}
          disabled={username.length < 3}
          onPress={() => setScreen("difficulty")}
        >
          <Text style={styles.loginText}>LOGIN</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /* ================= DIFFICULTY (UNCHANGED STYLE) ================= */
  if (screen === "difficulty") {
    return (
      <View style={styles.loginContainer}>
        <Text style={styles.appTitle}>Select Difficulty</Text>

        {["Easy", "Normal", "Hard"].map((d) => (
          <TouchableOpacity
            key={d}
            style={styles.loginButton}
            onPress={() => {
              setDifficulty(d);
              setScreen("game");
            }}
          >
            <Text style={styles.loginText}>{d.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => setScreen("highscore")}
        >
          <Text style={styles.loginText}>HIGH SCORES</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (screen === "highscore") {
    return <HighScoreScreen goBack={() => setScreen("difficulty")} />;
  }

  return (
    <GameScreen
      difficulty={difficulty}
      goHighScore={() => setScreen("highscore")}
    />
  );
}

/* ================= GAME ================= */

function GameScreen({ difficulty, goHighScore }) {
  const settings = {
    Easy: { gravity: 0.6, speed: 7 },
    Normal: { gravity: 0.85, speed: 9 },
    Hard: { gravity: 1.1, speed: 12 },
  }[difficulty];

  const [playerY, setPlayerY] = useState(height - GROUND_HEIGHT - 120);
  const [obstacles, setObstacles] = useState([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const velocity = useRef(0);
  const jumps = useRef(2);
  const loop = useRef(null);

  useEffect(() => {
    loop.current = setInterval(() => {
      velocity.current += settings.gravity;
      let y = playerY + velocity.current;

      if (y >= height - GROUND_HEIGHT - 120) {
        y = height - GROUND_HEIGHT - 120;
        velocity.current = 0;
        jumps.current = 2;
      }

      setPlayerY(y);

      setObstacles((o) =>
        o.map((x) => ({ ...x, x: x.x - settings.speed })).filter((x) => x.x > -50)
      );

      if (Math.random() < 0.025)
        setObstacles((o) => [...o, { x: width }]);

      setScore((s) => s + 1);
    }, 16);

    return () => clearInterval(loop.current);
  }, [playerY]);

  useEffect(() => {
    obstacles.forEach((o) => {
      if (
        o.x < PLAYER_X + 30 &&
        o.x + 40 > PLAYER_X &&
        playerY > height - GROUND_HEIGHT - 140
      ) {
        setGameOver(true);
        clearInterval(loop.current);
        saveHighScore();
      }
    });
  }, [obstacles]);

  const saveHighScore = async () => {
    const key = `HIGH_${difficulty}`;
    const best = Number(await AsyncStorage.getItem(key)) || 0;
    if (score > best) {
      await AsyncStorage.setItem(key, score.toString());
    }
  };

  const jump = () => {
    if (jumps.current > 0 && !gameOver) {
      velocity.current = -15;
      jumps.current--;
    }
  };

  return (
    <Pressable style={styles.container} onPressIn={jump}>
      <Text style={styles.score}>Score: {score}</Text>

      <View style={[styles.player, { top: playerY }]} />

      {obstacles.map((o, i) => (
        <View key={i} style={[styles.obstacle, { left: o.x }]} />
      ))}

      <View style={styles.ground} />

      {gameOver && (
        <View style={styles.overlay}>
          <Text style={styles.gameOver}>GAME OVER</Text>

          <TouchableOpacity style={styles.loginButton} onPress={goHighScore}>
            <Text style={styles.loginText}>HIGH SCORES</Text>
          </TouchableOpacity>
        </View>
      )}
    </Pressable>
  );
}

/* ================= HIGH SCORE SCREEN ================= */

function HighScoreScreen({ goBack }) {
  const [scores, setScores] = useState({ Easy: 0, Normal: 0, Hard: 0 });

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem("HIGH_Easy"),
      AsyncStorage.getItem("HIGH_Normal"),
      AsyncStorage.getItem("HIGH_Hard"),
    ]).then(([e, n, h]) =>
      setScores({
        Easy: e || 0,
        Normal: n || 0,
        Hard: h || 0,
      })
    );
  }, []);

  return (
    <View style={styles.loginContainer}>
      <Text style={styles.appTitle}>High Scores</Text>

      {Object.entries(scores).map(([k, v]) => (
        <Text key={k} style={styles.scoreText}>
          {k}: {v}
        </Text>
      ))}

      <TouchableOpacity style={styles.loginButton} onPress={goBack}>
        <Text style={styles.loginText}>BACK</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ================= STYLES (UNCHANGED) ================= */

const styles = StyleSheet.create({
  loginContainer: {
    flex: 1,
    backgroundColor: "#0b0f1a",
    justifyContent: "center",
    alignItems: "center",
  },
  appTitle: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 30,
  },
  input: {
    width: "80%",
    borderWidth: 1,
    borderColor: "#555",
    borderRadius: 10,
    padding: 15,
    color: "#fff",
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: "#ff4757",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginTop: 15,
  },
  loginText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  container: {
    flex: 1,
    backgroundColor: "#0b0f1a",
  },
  score: {
    position: "absolute",
    top: 60,
    alignSelf: "center",
    color: "#fff",
    fontSize: 22,
  },
  scoreText: {
    color: "#fff",
    fontSize: 20,
    marginBottom: 15,
  },
  player: {
    position: "absolute",
    left: PLAYER_X,
    width: 30,
    height: 90,
    borderWidth: 2,
    borderColor: "#fff",
  },
  obstacle: {
    position: "absolute",
    bottom: GROUND_HEIGHT,
    width: 40,
    height: 50,
    backgroundColor: "#ff4757",
  },
  ground: {
    position: "absolute",
    bottom: 0,
    height: GROUND_HEIGHT,
    width: "100%",
    backgroundColor: "#1e272e",
  },
  overlay: {
    position: "absolute",
    top: height / 3,
    width: "100%",
    alignItems: "center",
  },
  gameOver: {
    color: "#fff",
    fontSize: 28,
    marginBottom: 20,
  },
});
