/**
 * @jest-environment jsdom
 */

import { screen, fireEvent, waitFor } from "@testing-library/dom"
import "@testing-library/jest-dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes.js"
import {localStorageMock} from "../__mocks__/localStorage.js"
import mockedStore from "../__mocks__/store.js"
import router from "../app/Router.js";

// mock du store

jest.mock("../app/store", () => mockedStore)

// Fonstion d'instanciation de NewBills

const setNewBill = () => {
  return new NewBill({
      document,
      onNavigate,
      store: mockedStore,
      localStorage: window.localStorage,
  })
}

// configuration du store

const configureStore = () => {
  Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
  })

  window.localStorage.setItem(
      "user",
      JSON.stringify({
          type: "Employee",
          email: "a@a",
      })
  )
}

// initialisation de l'interface utilisateur de NewBill

const initializeNewBillUI = () => {
  document.body.innerHTML = NewBillUI();
  window.onNavigate(ROUTES_PATH.NewBill);
}

// Configuration vant les tests

beforeAll(() => {
  configureStore();
})

// Configuration avant chaque test

beforeEach(() => {
  const root = document.createElement("div")
  root.setAttribute("id", "root")
  document.body.append(root)
  router()
  initializeNewBillUI()
})

// Configuration après chaque test

afterEach(() => {
  jest.resetAllMocks();
  document.body.innerHTML = "";
})

// Tests
describe("Given I am connected as an employee", () => {
  describe("When I am on the NewBill Page", () => {
    // test affichage de la page
    test("Then the form should be rendered", () => {
      // Vérification que le formulaire est rendu
      expect(screen.getByTestId("form-new-bill")).toBeTruthy()
    })

    // test de l'icone mail
    test("Then mail icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)
      const mailIcon = screen.getByTestId('icon-mail')
      expect(mailIcon.classList).toContain('active-icon')
    })

    test("Then handleChangeFile can handle invalid file if wrong type", () => {
      // Création d'une nouvelle instance de NewBill
      const newBill = setNewBill();
      // Espionnage de la méthode handleChangeFile de newBill pour pouvoir vérifier son invocation
      const handleChangeFile = jest.spyOn(newBill, "handleChangeFile");
      // Récupération de l'élément input de type "file" dans l'interface utilisateur
      const fileInput = screen.getByTestId("file")
      // Simulation d'une alerte dans l'interface utilisateur
      global.alert = jest.fn()
      // Vérification que l'élément d'alerte n'est pas visible initialement
      expect(global.alert).not.toHaveBeenCalled()

      // Ecoute l'evenement "change" qui appelle handleChangeFile
      fileInput.addEventListener("change", handleChangeFile)

      // Simulation d'un changement de fichier avec un fichier invalide de type incorrect
      fireEvent.change(fileInput, {
          target: {
              files: [
                  new File(["image"], "image.txt", {
                      type: "text/plain",
                  }),
              ],
          },
      })

      // Vérification que la méthode handleChangeFile a été appelée une fois
      expect(handleChangeFile).toHaveBeenCalledTimes(1)
      // Vérification que l'élément d'alerte est visible
      expect(global.alert).toHaveBeenCalledWith('Format de fichier invalide. Merci de télécharger un fichier au format .jpeg, .jpg ou .png')
    })

    test("Then handleSubmit should handle when I click on submit button", async () => {
      // Création d'une nouvelle instance de NewBill
      const newBill = setNewBill()
      // Récupération du formulaire de nouvelle note de frais dans l'interface utilisateur
      const newBillForm = screen.getByTestId("form-new-bill")
      // Espionnage de la méthode handleSubmit de newBill pour pouvoir vérifier son invocation
      const handleSubmit = jest.spyOn(newBill, "handleSubmit")

      // Ecoute l'evenement "submit" qui appelle handleSubmit
      newBillForm.addEventListener("submit", handleSubmit)

      // Simulation d'un clic sur le bouton de soumission du formulaire
      fireEvent.submit(newBillForm)

      // Vérification que la méthode handleSubmit a été appelée une fois
      expect(handleSubmit).toHaveBeenCalledTimes(1)
      // Vérification que le formulaire est visible
      expect(newBillForm).toBeVisible()
    })

    // test integration method POST
    test("Then I can create a new bill", async () => {
      // Mock de la fonction de création pour renvoyer une nouvelle note de frais
      const createBill = jest.fn(mockedStore.bills().create)
      const { fileUrl, key } = await createBill({
        // Données factices de la nouvelle note de frais
        id: "47qAXb6fIm2zOKkLzMro",
        vat: "80",
        fileUrl:
            "https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
        status: "pending",
        type: "Hôtel et logement",
        commentary: "séminaire billed",
        name: "encore",
        fileName: "preview-facture-free-201801-pdf-1.jpg",
        date: "2004-04-04",
        amount: 400,
        commentAdmin: "ok",
        email: "a@a",
        pct: 20,
      })

      // Vérification que la fonction de création est appelée avec les bons arguments
      expect(createBill).toHaveBeenCalledTimes(1)
      expect(createBill).toHaveBeenCalledWith({
        id: "47qAXb6fIm2zOKkLzMro",
        vat: "80",
        fileUrl:
            "https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
        status: "pending",
        type: "Hôtel et logement",
        commentary: "séminaire billed",
        name: "encore",
        fileName: "preview-facture-free-201801-pdf-1.jpg",
        date: "2004-04-04",
        amount: 400,
        commentAdmin: "ok",
        email: "a@a",
        pct: 20,
      })

      // Vérification des valeurs retournées
      expect(key).toBe("1234");
      expect(fileUrl).toBe("https://localhost:3456/images/test.jpg");
    });

    test("Then handleChangeFile should handle valid file", () => {
      // Création d'une nouvelle instance de NewBill
      const newBill = setNewBill()
      // Espionnage de la méthode handleChangeFile de newBill pour pouvoir vérifier son invocation
      const handleChangeFile = jest.spyOn(newBill, "handleChangeFile")
      const fileInput = screen.getByTestId("file")
      // Ecoute l'evenement "change" qui appelle handleChangeFile
      fileInput.addEventListener("change", handleChangeFile)
      // Simulation d'un changement de fichier avec un fichier valide
      fireEvent.change(fileInput, {
          target: {
              files: [
                  new File(["image"], "image.png", {
                      type: "image/png",
                  }),
              ],
          },
      })
      // Vérification que la méthode handleChangeFile a été appelée une fois
      expect(handleChangeFile).toHaveBeenCalledTimes(1)
    });

    test("Then new bill can be added but returns a 404 error", async () => {
      // Création d'une nouvelle instance de NewBill
      const newBill = setNewBill()
      // Espionnage de la méthode create du mockedStore pour renvoyer une erreur 404 lors de la création d'une note de frais
      const mockedBill = jest
          .spyOn(mockedStore, "bills")
          .mockImplementationOnce(() => {
              return {
                  create: jest
                      .fn()
                      .mockRejectedValue(new Error("Erreur 404")),
              }
          })

      // Vérification que l'appel à la méthode create de bills renvoie une erreur 404
      await expect(mockedBill().create).rejects.toThrow("Erreur 404")

      // Vérification que la méthode create a été appelée une fois
      expect(mockedBill).toHaveBeenCalledTimes(1)
      // Vérification des valeurs des propriétés de newBill après l'erreur 404
      expect(newBill.billId).toBeNull()
      expect(newBill.fileUrl).toBeNull()
      expect(newBill.fileName).toBeNull()
    })

    test("Then new bill can be added but returns a 500 error", async () => {
      // Création d'une nouvelle instance de NewBill
      const newBill = setNewBill()
      // Espionnage de la méthode create du mockedStore pour renvoyer une erreur 500 lors de la création d'une note de frais
      const mockedBill = jest
          .spyOn(mockedStore, "bills")
          .mockImplementationOnce(() => {
              return {
                  create: jest
                      .fn()
                      .mockRejectedValue(new Error("Erreur 500")),
              }
          })

      // Vérification que l'appel à la méthode create de bills renvoie une erreur 500
      await expect(mockedBill().create).rejects.toThrow("Erreur 500")

      // Vérification que la méthode create a été appelée une fois
      expect(mockedBill).toHaveBeenCalledTimes(1)

      // Vérification des valeurs des propriétés de newBill après l'erreur 500
      expect(newBill.billId).toBeNull()
      expect(newBill.fileUrl).toBeNull()
      expect(newBill.fileName).toBeNull()
    })
  })
})
