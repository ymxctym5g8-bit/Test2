# Beispiel Unit Tests mit testthat

library(testthat)

# Beispiel-Funktion zum Testen
calculate_sum <- function(a, b) {
  return(a + b)
}

# Test Suite
test_that("calculate_sum addiert zwei Zahlen korrekt", {
  expect_equal(calculate_sum(2, 3), 5)
  expect_equal(calculate_sum(0, 0), 0)
  expect_equal(calculate_sum(-1, 1), 0)
})

test_that("calculate_sum funktioniert mit Dezimalzahlen", {
  expect_equal(calculate_sum(1.5, 2.5), 4)
  expect_equal(calculate_sum(0.1, 0.2), 0.3, tolerance = 0.0001)
})

test_that("calculate_sum wirft Fehler bei ungültigen Eingaben", {
  expect_error(calculate_sum("a", 5), NA) # sollte NICHT werfen
})
