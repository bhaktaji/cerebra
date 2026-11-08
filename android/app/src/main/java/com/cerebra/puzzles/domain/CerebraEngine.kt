package com.cerebra.puzzles.domain

enum class GameId(
    val id: String,
    val index: Int,
    val title: String,
    val cognitiveSkill: String,
    val shortDescription: String
) {
    NUMBER_SEQUENCE("number-sequence", 1, "Number Sequence", "Quantitative & Inductive Reasoning", "Deduce missing values across arithmetic, geometric, recursive, and interleaved progressions."),
    PATTERN_MATRIX("pattern-matrix", 2, "Pattern Matrix", "Fluid Non-Verbal Intelligence", "Complete visual 2x2 and 3x3 Raven matrices governed by rotation, symmetry, and boolean logic."),
    WORD_CONNECTIONS("word-connections", 3, "Word Connections", "Verbal & Semantic Abstraction", "Bridge semantic analogies, triad associations, and abstract conceptual relationships."),
    LATERAL_THINKING("lateral-thinking", 4, "Lateral Thinking", "Divergent & Creative Reasoning", "Resolve paradoxical situations by questioning hidden assumptions and reframing context."),
    LOGIC_DETECTIVE("logic-detective", 5, "Logic Detective", "Formal Deductive Reasoning", "Cross-reference deductive clues on an interactive elimination matrix to isolate unique truths."),
    ODD_ONE_OUT("odd-one-out", 6, "Odd One Out", "Invariant Detection & Categorization", "Isolate the single anomaly that violates a shared mathematical, structural, or conceptual law."),
    MATH_MYSTERY("math-mystery", 7, "Math Mystery", "Algebraic & Operational Logic", "Crack missing-operator equations, symbolic balance systems, and arithmetic logic grids."),
    MEMORY_MASTER("memory-master", 8, "Memory Master", "Visual & Sequential Working Memory", "Encode and reconstruct spatial matrices, ordered sequences, and symbol transformations."),
    SPATIAL_INTELLIGENCE("spatial-intelligence", 9, "Spatial Intelligence", "Mental Rotation & Spatial Visualization", "Mentally rotate polyominoes, unfold punched paper creases, and project 3D cube nets."),
    MIND_INVESTIGATOR("mind-investigator", 10, "The Mind Investigator", "Evidentiary Synthesis & Critical Inquiry", "Cross-examine suspect alibis against forensic logs to expose contradictions and reconstruct cases.")
}

data class TierMetadata(
    val tier: Int,
    val name: String,
    val minLevel: Int,
    val maxLevel: Int
)

val DIFFICULTY_TIERS = listOf(
    TierMetadata(1, "Beginner", 1, 100),
    TierMetadata(2, "Easy", 101, 200),
    TierMetadata(3, "Easy–Intermediate", 201, 300),
    TierMetadata(4, "Intermediate", 301, 400),
    TierMetadata(5, "Intermediate–Advanced", 401, 500),
    TierMetadata(6, "Advanced", 501, 600),
    TierMetadata(7, "Hard", 601, 700),
    TierMetadata(8, "Very Hard", 701, 800),
    TierMetadata(9, "Expert", 801, 900),
    TierMetadata(10, "Master", 901, 1000)
)

fun getTierForLevel(levelNumber: Int): TierMetadata {
    val clamped = levelNumber.coerceIn(1, 1000)
    return DIFFICULTY_TIERS[(clamped - 1) / 100]
}

data class LevelOption(
    val id: String,
    val label: String
)

data class LevelData(
    val id: String,
    val gameId: GameId,
    val levelNumber: Int,
    val tier: Int,
    val tierName: String,
    val title: String,
    val prompt: String,
    val signature: String,
    val options: List<LevelOption>,
    val correctOptionId: String,
    val correctAnswerDisplay: String,
    val hints: List<String>,
    val explanation: String
)

/**
 * Deterministic Seeded PRNG (FNV-1a + Mulberry32) matching the core engine.
 */
class SeededRandom(seedInput: String) {
    private var state: UInt

    init {
        var h = 2166136261u
        for (ch in seedInput) {
            h = h xor ch.code.toUInt()
            h *= 16777619u
        }
        state = if (h == 0u) 0x6d2b79f5u else h
        nextDouble()
        nextDouble()
    }

    fun nextDouble(): Double {
        state += 0x6d2b79f5u
        var t = state
        t = (t xor (t shr 15)) * (t or 1u)
        t = t xor (t + (t xor (t shr 7)) * (t or 61u))
        val result = t xor (t shr 14)
        return result.toDouble() / 4294967296.0
    }

    fun nextInt(min: Int, max: Int): Int {
        return (nextDouble() * (max - min + 1)).toInt() + min
    }

    fun <T> shuffle(items: List<T>): List<T> {
        val copy = items.toMutableList()
        for (i in copy.size - 1 downTo 1) {
            val j = nextInt(0, i)
            val tmp = copy[i]
            copy[i] = copy[j]
            copy[j] = tmp
        }
        return copy
    }
}

object CerebraEngine {
    fun getLevelData(gameId: GameId, levelNumber: Int): LevelData {
        val lvl = levelNumber.coerceIn(1, 1000)
        val tierMeta = getTierForLevel(lvl)
        val rng = SeededRandom("${gameId.id}-v1-$lvl")
        val idxInTier = (lvl - 1) % 100

        val baseVal = lvl * (gameId.index + 2) + idxInTier
        val step = (idxInTier % 11) + tierMeta.tier + 2
        val correctVal = baseVal + 5 * step
        val rawOptions = rng.shuffle(
            listOf(
                correctVal.toString(),
                (correctVal + step).toString(),
                (correctVal - 2).toString(),
                (correctVal + 4).toString()
            )
        )
        val options = rawOptions.mapIndexed { index, label ->
            LevelOption(id = "opt-$index", label = label)
        }
        val correctOpt = options.first { it.label == correctVal.toString() }

        return LevelData(
            id = "${gameId.id}-L${lvl.toString().padStart(4, '0')}",
            gameId = gameId,
            levelNumber = lvl,
            tier = tierMeta.tier,
            tierName = tierMeta.name,
            title = "${gameId.title} #$lvl",
            prompt = "Solve ${gameId.title} Challenge #$lvl (Tier ${tierMeta.tier}: ${tierMeta.name}). Sequence base $baseVal with step +$step.",
            signature = "${gameId.id}-L$lvl-B$baseVal-S$step->$correctVal",
            options = options,
            correctOptionId = correctOpt.id,
            correctAnswerDisplay = correctVal.toString(),
            hints = listOf(
                "Analyze the structural progression rate across adjacent elements.",
                "The governing step invariant for this level is +$step.",
                "Applying the tier rule yields $correctVal."
            ),
            explanation = "Deterministic rule verification for ${gameId.title} Level $lvl (Tier ${tierMeta.tier}) uniquely resolves to $correctVal."
        )
    }
}
