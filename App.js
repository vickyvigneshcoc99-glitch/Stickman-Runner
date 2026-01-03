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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const savedUser = await AsyncStorage.getItem("USERNAME");
      if (savedUser) {
        setUsername(savedUser);
        setScreen("difficulty");
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const login = async () => {
    await AsyncStorage.setItem("USERNAME", username);
    setScreen("difficulty");
  };

  const logout = async () => {
    await AsyncStorage.removeItem("USERNAME");
    setUsername("");
    setDifficulty(null);
    setScreen("login");
  };

  if (loading) return null;

  /* ================= LOGIN SCREEN ================= */
  if (screen === "login") {
    return (
      <View style={styles.loginContainer}>
        <Text style={styles.appTitle}>Stick Man Runner</Text>

        <TextInput
          placeholder="Enter Username"
          placeholderTextColor="#aaa"
          style={styles.input}
          value={username}
          onChangeText={setUsername}
        />

        <TouchableOpacity
          style={[
            styles.loginButton,
            { opacity: username.length < 3 ? 0.5 : 1 },
          ]}
          disabled={username.length < 3}
          onPress={login}
        >
          <Text style={styles.loginText}>LOGIN</Text>
        </TouchableOpacity>

        <Text style={styles.hint}>Username must be 3+ characters</Text>
      </View>
    );
  }

  /* ================= DIFFICULTY SCREEN ================= */
  if (screen === "difficulty") {
    return (
      <View style={styles.loginContainer}>
        <Text style={styles.appTitle}>Select Difficulty</Text>

        {["Easy", "Normal", "Hard"].map((level) => (
          <TouchableOpacity
            key={level}
            style={styles.loginButton}
            onPress={() => {
              setDifficulty(level);
              setScreen("game");
            }}
          >
            <Text style={styles.loginText}>{level.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}

        <Text style={styles.hint}>Choose wisely 👀</Text>
      </View>
    );
  }

  return (
    <GameScreen
      username={username}
      difficulty={difficulty}
      onLogout={logout}
    />
  );
}

/* ================= GAME SCREEN ================= */

function GameScreen({ username, difficulty, onLogout }) {
  const settings = {
    Easy: { gravity: 0.6, speed: 7 },
    Normal: { gravity: 0.85, speed: 9 },
    Hard: { gravity: 1.1, speed: 12 },
  }[difficulty];

  const [playerY, setPlayerY] = useState(height - GROUND_HEIGHT - 120);
  const [obstacles, setObstacles] = useState([]);
  const [score, setScore] = useState(0);
  const [legToggle, setLegToggle] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  const velocity = useRef(0);
  const jumpsLeft = useRef(2);
  const speed = useRef(settings.speed);
  const loop = useRef(null);

  useEffect(() => {
    loop.current = setInterval(() => {
      velocity.current += settings.gravity;
      let newY = playerY + velocity.current;

      if (newY >= height - GROUND_HEIGHT - 120) {
        newY = height - GROUND_HEIGHT - 120;
        velocity.current = 0;
        jumpsLeft.current = 2;
      }

      setPlayerY(newY);

      setObstacles((obs) =>
        obs
          .map((o) => ({ ...o, x: o.x - speed.current }))
          .filter((o) => o.x > -60)
      );

      if (Math.random() < 0.025) {
        setObstacles((obs) => [
          ...obs,
          { x: width, width: 30 + Math.random() * 20 },
        ]);
      }

      setScore((s) => s + 1);
      setLegToggle((l) => !l);
    }, 16);

    return () => clearInterval(loop.current);
  }, [playerY]);

  useEffect(() => {
    obstacles.forEach((o) => {
      if (
        o.x < PLAYER_X + 30 &&
        o.x + o.width > PLAYER_X &&
        playerY > height - GROUND_HEIGHT - 140
      ) {
        setIsGameOver(true);
        clearInterval(loop.current);
      }
    });
  }, [obstacles, playerY]);

  const handleTouch = () => {
    if (isGameOver) return;
    if (jumpsLeft.current > 0) {
      velocity.current = -15;
      jumpsLeft.current -= 1;
    }
  };

  const resetGame = () => {
    setPlayerY(height - GROUND_HEIGHT - 120);
    velocity.current = 0;
    jumpsLeft.current = 2;
    setObstacles([]);
    setScore(0);
    setIsGameOver(false);
  };

  return (
    <Pressable style={styles.container} onPressIn={handleTouch}>
      <View style={styles.header}>
        <Text style={styles.username}>
          👤 {username} ({difficulty})
        </Text>
        <TouchableOpacity onPress={onLogout}>
          <Text style={styles.logout}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.score}>Score: {score}</Text>

      <View style={[styles.player, { top: playerY }]}>
        <View style={styles.head} />
        <View style={styles.body} />
        <View
          style={[
            styles.legs,
            { transform: [{ rotate: legToggle ? "20deg" : "-20deg" }] },
          ]}
        />
      </View>

      {obstacles.map((o, i) => (
        <View
          key={i}
          style={[styles.obstacle, { left: o.x, width: o.width }]}
        />
      ))}

      <View style={styles.ground} />

      {isGameOver && (
        <Text style={styles.gameOver} onPress={resetGame}>
          GAME OVER{"\n"}Tap to Restart
        </Text>
      )}
    </Pressable>
  );
}

/* ================= STYLES ================= */

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
    marginBottom: 40,
  },
  input: {
    width: "80%",
    borderWidth: 1,
    borderColor: "#555",
    borderRadius: 10,
    padding: 15,
    color: "#fff",
    fontSize: 16,
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: "#ff4757",
    paddingVertical: 14,
    paddingHorizontal: 50,
    borderRadius: 10,
    marginBottom: 15,
  },
  loginText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  hint: {
    color: "#777",
    marginTop: 15,
  },
  container: {
    flex: 1,
    backgroundColor: "#0b0f1a",
  },
  header: {
    position: "absolute",
    top: 40,
    width: "100%",
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  username: {
    color: "#fff",
    fontSize: 16,
  },
  logout: {
    color: "#ff6b81",
    fontSize: 16,
  },
  score: {
    position: "absolute",
    top: 80,
    alignSelf: "center",
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  player: {
    position: "absolute",
    left: PLAYER_X,
    alignItems: "center",
  },
  head: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#fff",
  },
  body: {
    width: 4,
    height: 45,
    backgroundColor: "#fff",
  },
  legs: {
    width: 30,
    height: 18,
    borderBottomWidth: 2,
    borderColor: "#fff",
  },
  obstacle: {
    position: "absolute",
    bottom: GROUND_HEIGHT,
    height: 50,
    backgroundColor: "#ff4757",
    borderRadius: 6,
  },
  ground: {
    position: "absolute",
    bottom: 0,
    height: GROUND_HEIGHT,
    width: "100%",
    backgroundColor: "#1e272e",
  },
  gameOver: {
    position: "absolute",
    top: height / 2 - 70,
    width: "100%",
    textAlign: "center",
    fontSize: 28,
    color: "#fff",
    fontWeight: "bold",
  },
});

