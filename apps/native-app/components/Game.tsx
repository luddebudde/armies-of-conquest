import { Client, Room } from "colyseus.js";
import {
  Fragment,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Canvas,
  GroupProps,
  MeshProps,
  ThreeEvent,
  Vector3,
} from "@react-three/fiber/native";
import {
  PerspectiveCamera,
  Plane,
  Sphere,
  Line,
} from "@react-three/drei/native";
import {closestTown, MyRoomState, Vec, ToJSON, origin, Town} from "server";
import { Text, View, StyleSheet, Platform } from "react-native";
import { FpsCounter } from "@/components/Fps";
import { ShaderMaterial } from "three";

const defaultVert = `
varying vec3 vUv; 

void main() {
  vUv = position; 

  vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * modelViewPosition; 
}
`;

const defaultFrag = `
uniform vec3 colorA; 
uniform vec3 colorB; 
varying vec3 vUv;

void main() {
  gl_FragColor = vec4(mix(colorA, colorB, vUv.z), 1.0);
}
`;

const defaultGroundUniform = {
  townsLength: {
    value: 2,
  },
  towns: {
    value: [
      // xy
      0.0, 0.0,
      // rgb
      0.0, 0.5, 0.0,
      //  xy
      10.0, 10.0,
      // rgb
      0.5, 0.5, 0.0,
    ],
  },
};

const groundFrag = `
const int maxCities = 50;
const int len = (2 + 3) * maxCities;
uniform float towns[len]; 
uniform int townsLength;
varying vec3 vUv;

void main() {
  int closestTownIndex = 0;
  float closestDistance = 1e10;
  for (int i = 0; i < townsLength ; i++){
    // vec2 closestTown = vec2(towns[closestTownIndex * 5 + 0], towns[closestTownIndex * 5 + 0 + 1]);
    vec2 currentTown = vec2(towns[i * 5 + 0], towns[i * 5 + 0 + 1]);
    float d = distance(vUv.xy, currentTown);
    if (d < closestDistance){
      closestTownIndex = i;
      closestDistance = d;
    }
  }
  //   
  vec4 color = vec4(towns[closestTownIndex * 5 + 2 + 0], towns[closestTownIndex * 5 + 2 + 1], towns[closestTownIndex * 5 + 2 + 2], 1.0);
  vec4 groundColor = vec4(0.0, 0.5, 0.0, 1.0);
    gl_FragColor = mix(groundColor, color, 0.5);
}
`;

export const vec3 = (v: Vec) => [v.x, 0, v.y] as [number, number, number];
export const origin3: Vector3 = [0, 0, 0];

const PlayerMesh = (props: MeshProps & { color: string }) => (
  <mesh scale={0.15} castShadow receiveShadow {...props}>
    <cylinderGeometry args={[1, 1, 1]} />
    <meshStandardMaterial color={props.color} />
  </mesh>
);

type TownMeshProps = GroupProps & { label: ReactNode } & {
  town: ToJSON<Town>;
};

const hexFromTuple = (tuple: [number, number, number]) => {
  const r = Math.floor(tuple[0] * 255).toString(16).padStart(2, '0');
  const g = Math.floor(tuple[1] * 255).toString(16).padStart(2, '0');
  const b = Math.floor(tuple[2] * 255).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`.toUpperCase();
}

const TownMesh = (props: TownMeshProps) => (
  <group {...props}>
    <mesh scale={[0.5, 0.5, 0.5]} castShadow receiveShadow>
      <cylinderGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={hexFromTuple(props.town.color)} />
    </mesh>
    {/* TODO fix */}
    {/*<Html*/}
    {/*  center*/}
    {/*  position={[0, 0.5, 0]}*/}
    {/*>*/}
    {/*  {props.label}*/}
    {/*</Html>*/}
  </group>
);

const TargetMesh = (props: MeshProps) => (
  <mesh scale={[0.03, 1, 0.03]} castShadow receiveShadow {...props}>
    <cylinderGeometry args={[1, 1, 1]} />
    <meshStandardMaterial color={"red"} />
  </mesh>
);

type GameState =
  | {
      tag: "loading";
    }
  | {
      tag: "loaded";
      room: Room;
      state: ToJSON<MyRoomState>;
    };

const useGame = (): GameState => {
  const [state, setState] = useState<ToJSON<MyRoomState>>({
    players: {},
    towns: {},
    size: { width: 0, height: 0 },
  });

  const roomRef = useRef<Room>();

  useEffect(() => {
    const join = async () => {
      const port = "2567";
      const ip = Platform.OS === "android" ? "192.168.129.143" : "localhost";
      const client = new Client(`ws://${ip}:${port}`);
      console.log("Joining room...");
      try {
        roomRef.current = await client.joinOrCreate<MyRoomState>("my_room");
        console.log("Joined successfully!");

        const room = roomRef.current;
        // Initialize state
        room.onStateChange.once((state) => {
          setState(() => room.state.toJSON());
        });

        // Subscribe to state changes
        const watchedEntityTypes = ["players", "towns"] as const;
        watchedEntityTypes.forEach((entityType) => {
          room.state[entityType].onChange((entity, id) => {
            const updateState = () =>
              setState((state) => ({
                ...state,
                [entityType]: {
                  ...state[entityType],
                  [id]: entity.toJSON(),
                },
              }));
            entity.onChange(updateState);
          });
        });
      } catch (e) {
        console.error(e);
      }
    };
    join();
    const handle = setInterval(() => {
      // Update
      const room = roomRef.current;
      if (!room) {
        return;
      }
      // room.send(0, inputPayload)
    }, 100);
    return () => clearInterval(handle);
  }, []);

  useEffect(() => {
    const towns = Object.values(state.towns)
    groundMaterial.uniforms.towns.value = towns
      .map((town) => [town.pos.x, -town.pos.y, town.color[0], town.color[1], town.color[2]])
      .flat();
    groundMaterial.uniforms.townsLength.value = towns.length;
  }, [state.towns]);

  return !roomRef.current
    ? {
        tag: "loading",
      }
    : {
        tag: "loaded",
        room: roomRef.current,
        state,
      };
};

const groundMaterial = new ShaderMaterial({
  uniforms: defaultGroundUniform,
  vertexShader: defaultVert,
  fragmentShader: groundFrag,
});

const styles = StyleSheet.create({
  game: {
    flex: 1,
  },
  canvas: {
    flex: 1,
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    alignItems: "center",
    gap: 10,
  },
  ul: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  li: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  liBullet: {
    fontWeight: "bold",
    fontSize: 24,
  },
  liText: {
    fontSize: 18,
  },
  townLabel: {
    color: "white",
    flexWrap: "nowrap",
  },
});

export const Game = () => {
  const state = useGame();

  if (state.tag === "loading") {
    return <Text>Loading...</Text>;
  }

  return <LoadedGame state={state} />;
};

const LoadedGame = (props: {
  state: Extract<
    GameState,
    {
      tag: "loaded";
    }
  >;
}) => {
  const s = props.state;

  const { state, room } = s;

  const handleClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      console.log("sending click");
      room.send("click", {
        x: event.point.x,
        y: event.point.z,
      });
    },
    [room],
  );

  const me = state.players[room.sessionId ?? ""];

  if (!me) {
    return <Text>Loading...</Text>;
  }

  const towns = Object.values(state.towns);

  return (
    <View style={styles.game}>
      <View
        style={{
          position: "absolute",
          zIndex: 1,
          padding: 10,
        }}
      >
        <FpsCounter />
        {me && (
          <View>
            <Text style={styles.header}>Me ({me.color})</Text>
            <View>
              <Text>Soldiers: {Math.ceil(me.soldiers)}</Text>
              <Text>Hunger: {Math.ceil(me.hunger * 100)}%</Text>
              <Text>Pos: ({Math.round(me.pos.x)},{(Math.round( me.pos.y))}) </Text>
            </View>
          </View>
        )}
        <View>
          <Text style={styles.header}>Players:</Text>
          <View style={styles.ul}>
            {Object.entries(state.players).map(([playerId, player]) => (
              <View key={playerId} style={styles.li}>
                <View
                  style={{
                    backgroundColor: player.color,
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                  }}
                ></View>
                <Text>{playerId}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
      <Canvas style={styles.canvas} shadows>
        <ambientLight intensity={1.5} />
        <Sphere position={[-5, 5, 5]}>
          <meshStandardMaterial color="yellow" />
        </Sphere>
        <directionalLight
          position={[-5, 5, 5]}
          intensity={1}
          shadow-mapSize={[1024, 1024]}
          castShadow
        ></directionalLight>
        <PerspectiveCamera position={[2, 2, 10]} makeDefault />
        <Plane
          args={[state.size.width, state.size.height]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
          onClick={handleClick}
        >
          <shaderMaterial attach="material" args={[groundMaterial]} />
        </Plane>
        {Object.entries(state.players).map(([playerId, player]) => (
          <Fragment key={playerId}>
            <PlayerMesh
              position={[player.pos.x, 0, player.pos.y]}
              color={player.color}
            />
            <Line
              points={[
                vec3(player.pos),
                vec3(closestTown(player.pos, towns)?.pos ?? origin),
              ]} // Array of points, Array<Vector3 | Vector2 | [number, number, number] | [number, number] | number>
              color={player.color} // Default
              lineWidth={3} // In pixels (default)
              segments // If true, renders a THREE.LineSegments2. Otherwise, renders a THREE.Line2
              dashed={false} // Default
            />
          </Fragment>
        ))}
        <TargetMesh position={[me.target.x ?? 0, 0, me.target.y ?? 0]} />
        {towns.map((town) => (
          <TownMesh
            key={town.id}
            position={[town.pos.x ?? 0, 0, town.pos.y ?? 0]}
            town={town}
            label={
              <View>
                <Text style={styles.townLabel}>{town.name}</Text>
                <Text style={styles.townLabel}>
                  🍏{" "}
                  {Math.ceil(
                    (town.dailyRations / (365 * town.population)) * 100,
                  )}
                </Text>
                <Text style={styles.townLabel}>
                  👥 {Math.ceil(town.population)}
                </Text>
              </View>
            }
          />
        ))}
      </Canvas>
    </View>
  );
};
