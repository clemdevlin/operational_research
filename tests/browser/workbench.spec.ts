import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  await page.goto("/");
});
test("example, live coefficients, blank validation, reset and sliders", async ({
  page,
}) => {
  await expect(
    page.getByRole("heading", { name: "Maximum Z = 10", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Objective x coefficient").fill("1");
  await expect(
    page.getByRole("heading", { name: "Maximum Z = 7", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Objective x coefficient").fill("");
  await expect(
    page.getByRole("alert").filter({ hasText: "Enter a finite number" }),
  ).toContainText("finite number");
  await page.getByRole("button", { name: "Reset example" }).click();
  await expect(page.getByLabel("Objective x coefficient")).toHaveValue("3");
  await expect(
    page.getByRole("alert").filter({ hasText: "Enter a finite number" }),
  ).toHaveCount(0);
  await page.getByLabel("Constraint 2 RHS slider").fill("1");
  await expect(
    page.getByRole("heading", { name: "Maximum Z = 9", exact: true }),
  ).toBeVisible();
});
test("infeasible, unbounded, equality and multiple solutions", async ({
  page,
}) => {
  await page.getByLabel("Constraint 1 right-hand side").fill("-1");
  await expect(
    page.getByRole("heading", { name: "No feasible solution" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reset example" }).click();
  await page.getByLabel("Objective x coefficient").fill("2");
  await expect(
    page.getByText("Multiple optimal solutions:", { exact: false }),
  ).toBeVisible();
  await page.getByLabel("Constraint 1 relation").selectOption("=");
  await expect(
    page.getByRole("heading", { name: "Maximum Z = 8", exact: true }),
  ).toBeVisible();
  for (let i = 3; i > 0; i--)
    await page
      .getByRole("button", { name: `Remove constraint ${i}`, exact: true })
      .click();
  await expect(
    page.getByRole("heading", { name: "The objective is unbounded" }),
  ).toBeVisible();
});
test("constraint limit, table toggle, direction and negative variables", async ({
  page,
}) => {
  for (let i = 0; i < 5; i++)
    await page.getByRole("button", { name: /Add constraint/ }).click();
  await expect(
    page.getByRole("button", { name: /Add constraint/ }),
  ).toBeDisabled();
  await page.getByLabel("Optimization direction").selectOption("min");
  await expect(
    page.getByRole("heading", { name: "Minimum Z = 0", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Show corner-point calculations").uncheck();
  await expect(page.getByRole("table")).toHaveCount(0);
  await page.getByLabel("Assume x ≥ 0 and y ≥ 0").uncheck();
  await expect(
    page.getByRole("heading", { name: "The objective is unbounded" }),
  ).toBeVisible();
});
test("phone layout has no horizontal overflow and controls remain usable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await expect(
    page.getByRole("heading", { name: "Linear Programming", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByLabel("Constraint 1 right-hand side").fill("3");
  await expect(
    page.getByRole("heading", { name: "Maximum Z = 8", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("img", { name: /Linear programming graph/ })
    .scrollIntoViewIfNeeded();
  await page.screenshot({
    path: "/tmp/operational-mobile.png",
    fullPage: true,
  });
});
