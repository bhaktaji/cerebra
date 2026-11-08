package com.cerebra.puzzles

import com.cerebra.puzzles.domain.CerebraEngine
import com.cerebra.puzzles.domain.GameId
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class EngineValidationTest {
    @Test
    fun validateAll10GamesAnd10000Levels() {
        assertEquals(10, GameId.entries.size)
        for (game in GameId.entries) {
            val ids = mutableSetOf<String>()
            val signatures = mutableSetOf<String>()
            for (lvl in 1..1000) {
                val a = CerebraEngine.getLevelData(game, lvl)
                val b = CerebraEngine.getLevelData(game, lvl)
                assertEquals(a.id, b.id)
                assertEquals(a.signature, b.signature)
                assertEquals(a.correctOptionId, b.correctOptionId)
                assertTrue(a.options.any { it.id == a.correctOptionId })
                ids.add(a.id)
                signatures.add(a.signature)
            }
            assertEquals(1000, ids.size)
            assertEquals(1000, signatures.size)
        }
    }
}
