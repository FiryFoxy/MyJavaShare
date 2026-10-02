import { JavaProject } from '../types';

const STORAGE_KEY = 'javadrop_projects_v1';

export const SAMPLE_PROJECTS: JavaProject[] = [
  {
    id: 'guess-the-number',
    title: 'Guess the Number',
    description: 'A classic interactive number guessing game. Try to guess the secret number with hot/cold hints!',
    author: 'Fulvio',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    type: 'code',
    category: 'game',
    instructions: 'The computer picks a secret number between 1 and 100. Type your guess in the terminal and press Enter. Follow the clues to win in the fewest attempts!',
    tags: ['Interactive Game', 'Beginner', 'Scanner Input'],
    isSample: true,
    files: [
      {
        name: 'GuessNumber.java',
        isMain: true,
        content: `import java.util.Scanner;
import java.util.Random;

public class GuessNumber {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        Random random = new Random();

        int target = random.nextInt(100) + 1;
        int attempts = 0;
        boolean hasWon = false;

        System.out.println("========================================");
        System.out.println("   WELCOME TO GUESS THE NUMBER!       ");
        System.out.println("========================================");
        System.out.println("I've chosen a secret number between 1 and 100.");
        System.out.println("Can you guess what it is?\\n");

        while (!hasWon) {
            System.out.print("Enter your guess: ");
            if (!scanner.hasNextInt()) {
                System.out.println("Please enter a valid number!");
                scanner.next();
                continue;
            }

            int guess = scanner.nextInt();
            attempts++;

            if (guess == target) {
                hasWon = true;
                System.out.println("\\n🎉 CONGRATULATIONS! You got it right!");
                System.out.println("The secret number was " + target + ".");
                System.out.println("It took you " + attempts + " tries.");

                if (attempts <= 5) {
                    System.out.println("Rating: ⭐⭐⭐⭐⭐ Master Mind!");
                } else if (attempts <= 8) {
                    System.out.println("Rating: ⭐⭐⭐ Great Job!");
                } else {
                    System.out.println("Rating: ⭐ Keep Practicing!");
                }
            } else if (guess < target) {
                System.out.println("Too low! ⬆️ Try a higher number.");
            } else {
                System.out.println("Too high! ⬇️ Try a lower number.");
            }
            System.out.println();
        }

        System.out.println("Thanks for playing my Java game!");
    }
}
`,
      },
    ],
  },
  {
    id: 'dungeon-quest-rpg',
    title: 'Dungeon Quest RPG',
    description: 'An interactive text-based fantasy adventure RPG with turn-based monster battles and potion management.',
    author: 'Fulvio',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    type: 'code',
    category: 'game',
    instructions: 'Type 1, 2, or 3 to navigate dungeon corridors, battle goblin fiends, and drink healing potions. Try to survive to floor 5!',
    tags: ['RPG Game', 'Text Adventure', 'OOP Logic'],
    isSample: true,
    files: [
      {
        name: 'DungeonQuest.java',
        isMain: true,
        content: `import java.util.Scanner;
import java.util.Random;

public class DungeonQuest {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        Random rand = new Random();

        // Player specs
        int health = 100;
        int attackDmg = 30;
        int numHealthPotions = 3;
        int potionHealAmount = 30;
        int potionDropChance = 50; // percentage

        // Enemies
        String[] enemies = { "Skeleton Warrior", "Shadow Zombie", "Goblin Brute", "Dungeon Golem" };
        int maxEnemyHealth = 75;
        int enemyAttackDmg = 25;

        boolean running = true;

        System.out.println("---------------------------------------------");
        System.out.println("       WELCOME TO THE ANCIENT DUNGEON        ");
        System.out.println("---------------------------------------------");

        GAME:
        while (running) {
            System.out.println("---------------------------------------------");
            int enemyHealth = rand.nextInt(maxEnemyHealth) + 20;
            String enemy = enemies[rand.nextInt(enemies.length)];
            System.out.println("\\t# A fearsome " + enemy + " has appeared! #\\n");

            while (enemyHealth > 0) {
                System.out.println("\\tYour HP: " + health);
                System.out.println("\\t" + enemy + "'s HP: " + enemyHealth);
                System.out.println("\\n\\tWhat would you like to do?");
                System.out.println("\\t1. Attack");
                System.out.println("\\t2. Drink health potion (" + numHealthPotions + " left)");
                System.out.println("\\t3. Run away!");

                System.out.print("\\t> ");
                String input = in.nextLine().trim();

                if (input.equals("1")) {
                    int damageDealt = rand.nextInt(attackDmg) + 10;
                    int damageTaken = rand.nextInt(enemyAttackDmg) + 5;

                    enemyHealth -= damageDealt;
                    health -= damageTaken;

                    System.out.println("\\n\\t> You strike the " + enemy + " for " + damageDealt + " damage.");
                    System.out.println("\\t> You receive " + damageTaken + " in retaliation!");

                    if (health < 1) {
                        System.out.println("\\n\\tYou have taken too much damage, you are too weak to go on!");
                        break;
                    }
                } else if (input.equals("2")) {
                    if (numHealthPotions > 0) {
                        health += potionHealAmount;
                        numHealthPotions--;
                        System.out.println("\\n\\t> You drink a health potion, healing yourself for " + potionHealAmount + " HP.");
                        System.out.println("\\t> You now have " + health + " HP.");
                        System.out.println("\\t> Potions left: " + numHealthPotions);
                    } else {
                        System.out.println("\\n\\t> You have no potions left! Defeat enemies for a chance to get one.");
                    }
                } else if (input.equals("3")) {
                    System.out.println("\\n\\tYou run away from the " + enemy + "!");
                    continue GAME;
                } else {
                    System.out.println("\\n\\tInvalid command!");
                }
            }

            if (health < 1) {
                System.out.println("\\n---------------------------------------------");
                System.out.println("You limp out of the dungeon, defeated.");
                System.out.println("GAME OVER!");
                break;
            }

            System.out.println("---------------------------------------------");
            System.out.println(" # " + enemy + " was vanquished! #");
            System.out.println(" # You have " + health + " HP remaining. #");

            if (rand.nextInt(100) < potionDropChance) {
                numHealthPotions++;
                System.out.println(" # The " + enemy + " dropped a health potion! #");
                System.out.println(" # You now have " + numHealthPotions + " potion(s). #");
            }

            System.out.println("---------------------------------------------");
            System.out.println("What would you like to do now?");
            System.out.println("1. Continue deeper into the dungeon");
            System.out.println("2. Exit dungeon victorious");
            System.out.print("> ");

            String input = in.nextLine().trim();
            while (!input.equals("1") && !input.equals("2")) {
                System.out.println("Invalid command! Type 1 or 2:");
                System.out.print("> ");
                input = in.nextLine().trim();
            }

            if (input.equals("2")) {
                System.out.println("\\nYou exit the dungeon safely, loaded with treasure and glory!");
                break;
            }
        }

        System.out.println("\\n=============================================");
        System.out.println("THANK YOU FOR PLAYING DUNGEON QUEST!");
        System.out.println("=============================================");
    }
}
`,
      },
    ],
  },
  {
    id: 'retro-snake-arcade',
    title: 'Retro Snake Arcade',
    description: 'A 2D graphical snake game built with simulated Java 2D Canvas. Collect apples and grow as long as possible!',
    author: 'Fulvio',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    type: 'code',
    category: 'graphics',
    instructions: 'Use the Arrow Keys (or W, A, S, D) or on-screen directional buttons to steer the snake. Eat red apples, avoid colliding with walls or your own tail!',
    tags: ['2D Game', 'Canvas Graphics', 'Arcade'],
    isSample: true,
    files: [
      {
        name: 'SnakeGame.java',
        isMain: true,
        content: `// Java 2D Arcade Snake Game
// Supports in-browser interactive graphical rendering!

public class SnakeGame {
    public static final int GRID_WIDTH = 20;
    public static final int GRID_HEIGHT = 20;

    public static void main(String[] args) {
        System.out.println("Initializing Snake Game 2D Canvas Engine...");
        System.out.println("Canvas resolution: " + (GRID_WIDTH * 20) + "x" + (GRID_HEIGHT * 20));
        System.out.println("Controls: Arrow Keys / WASD");
        System.out.println("Enjoy the game!");
    }
}
`,
      },
    ],
  },
  {
    id: 'bouncing-physics-sim',
    title: 'Bouncing Physics World',
    description: 'Real-time 2D multi-particle physics simulation with gravity, bounce friction, velocity vectors, and collisions.',
    author: 'Fulvio',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    type: 'code',
    category: 'graphics',
    instructions: 'Click anywhere on the simulation canvas to spawn new bouncing particles with randomized colors and velocity! Watch gravity and energy restitution in action.',
    tags: ['Physics Simulation', 'Canvas 2D', 'Particles'],
    isSample: true,
    files: [
      {
        name: 'BouncingBalls.java',
        isMain: true,
        content: `// Bouncing Particles Physics Simulator in Java
public class BouncingBalls {
    public static void main(String[] args) {
        System.out.println("Starting Physics Particle System...");
        System.out.println("Gravity: 9.8 m/s^2");
        System.out.println("Restitution (elasticity): 0.85");
        System.out.println("Click the viewport to spawn new particles!");
    }
}
`,
      },
    ],
  },
  {
    id: 'prime-benchmarker',
    title: 'Prime & Fibonacci Benchmark',
    description: 'A mathematical algorithm benchmarker calculating prime distributions, prime factors, and recursive Fibonacci sequences.',
    author: 'Fulvio',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    type: 'code',
    category: 'utility',
    instructions: 'Select how many primes or Fibonacci numbers you want to compute. See the execution speed and number theory results instantly.',
    tags: ['Math Algorithm', 'Performance Benchmark', 'Algorithms'],
    isSample: true,
    files: [
      {
        name: 'MathBenchmark.java',
        isMain: true,
        content: `import java.util.Scanner;

public class MathBenchmark {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        System.out.println("==========================================");
        System.out.println("   JAVA MATH & ALGORITHM BENCHMARK        ");
        System.out.println("==========================================");
        System.out.println("1. Find Primes up to N (Sieve of Eratosthenes)");
        System.out.println("2. Generate Fibonacci Series");
        System.out.println("3. Calculate Factorial & Prime Factors");
        System.out.print("\\nEnter choice (1-3): ");

        int choice = scanner.hasNextInt() ? scanner.nextInt() : 1;

        if (choice == 1) {
            System.out.print("Enter upper bound N (e.g. 500): ");
            int n = scanner.hasNextInt() ? scanner.nextInt() : 100;
            if (n > 2000) n = 2000;

            System.out.println("\\nCalculating primes up to " + n + "...");
            int count = 0;
            for (int i = 2; i <= n; i++) {
                if (isPrime(i)) {
                    System.out.print(i + " ");
                    count++;
                    if (count % 12 == 0) System.out.println();
                }
            }
            System.out.println("\\n\\nTotal primes found: " + count);
        } else if (choice == 2) {
            System.out.print("How many Fibonacci numbers (1-35)? ");
            int count = scanner.hasNextInt() ? scanner.nextInt() : 15;
            if (count > 40) count = 40;

            long a = 0, b = 1;
            System.out.println("\\nFibonacci sequence:");
            for (int i = 1; i <= count; i++) {
                System.out.print(a + " ");
                long next = a + b;
                a = b;
                b = next;
                if (i % 8 == 0) System.out.println();
            }
            System.out.println();
        } else {
            System.out.print("Enter a positive number to factorize: ");
            int num = scanner.hasNextInt() ? scanner.nextInt() : 84;
            System.out.println("\\nPrime factors of " + num + ":");
            int temp = num;
            for (int factor = 2; factor <= temp; factor++) {
                while (temp % factor == 0) {
                    System.out.print(factor + " ");
                    temp /= factor;
                }
            }
            System.out.println();
        }

        System.out.println("\\nBenchmark completed successfully.");
    }

    private static boolean isPrime(int n) {
        if (n <= 1) return false;
        if (n <= 3) return true;
        if (n % 2 == 0 || n % 3 == 0) return false;
        for (int i = 5; i * i <= n; i += 6) {
            if (n % i == 0 || n % (i + 2) == 0) return false;
        }
        return true;
    }
}
`,
      },
    ],
  },
];

export function getStoredProjects(): JavaProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // First time initialization: seed sample projects
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_PROJECTS));
      return SAMPLE_PROJECTS;
    }
    const projects = JSON.parse(raw) as JavaProject[];
    return projects;
  } catch (err) {
    console.error('Failed to load projects from localStorage:', err);
    return SAMPLE_PROJECTS;
  }
}

export function saveProject(project: JavaProject): void {
  const existing = getStoredProjects();
  const index = existing.findIndex(p => p.id === project.id);
  let updated: JavaProject[];

  if (index >= 0) {
    updated = [...existing];
    updated[index] = {
      ...project,
      updatedAt: new Date().toISOString(),
    };
  } else {
    updated = [
      {
        ...project,
        createdAt: project.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      ...existing,
    ];
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('LocalStorage save error (likely quota for large binary):', err);
  }
}

export function deleteProject(id: string): void {
  const existing = getStoredProjects();
  const updated = existing.filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function getProjectById(id: string): JavaProject | undefined {
  const projects = getStoredProjects();
  return projects.find(p => p.id === id);
}

export function exportAllProjectsJson(): string {
  const projects = getStoredProjects();
  return JSON.stringify(projects, null, 2);
}

export function importProjectsFromJson(jsonString: string): { success: boolean; count: number; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    if (!Array.isArray(parsed)) {
      throw new Error('Imported data must be an array of projects.');
    }
    const existing = getStoredProjects();
    const existingIds = new Set(existing.map(p => p.id));
    
    const merged = [...existing];
    let addedCount = 0;

    for (const proj of parsed) {
      if (proj && proj.id && proj.title) {
        if (!existingIds.has(proj.id)) {
          merged.push(proj);
          addedCount++;
        }
      }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return { success: true, count: addedCount };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown parsing error';
    return { success: false, count: 0, error: msg };
  }
}
