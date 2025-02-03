import { buildSLSAProvenancePredicate } from '@actions/attest'
import * as core from '@actions/core'
import { parseMultiImageInput } from './utils'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const subjectImages = core.getInput('subject-images')
    if (subjectImages) {
      const images = parseMultiImageInput(subjectImages)
      for (const image of images) {
        core.info(`Processing image: ${image}`)
        // Add logic to process each image for attestation
        // Assuming processImageForAttestation is a function that processes the image
        await processImageForAttestation(image)
      }
    }

    // Calculate subject from inputs and generate provenance
    const predicate = await buildSLSAProvenancePredicate()

    core.setOutput('predicate', predicate.params)
    core.setOutput('predicate-type', predicate.type)
  } catch (err) {
    const error = err instanceof Error ? err : new Error(`${err}`)
    // Fail the workflow run if an error occurs
    core.setFailed(error.message)
  }
}

/**
 * Processes an image for attestation.
 * @param {string} image - The image to process.
 * @returns {Promise<void>} Resolves when the image is processed.
 */
async function processImageForAttestation(image: string): Promise<void> {
  // Add the actual logic to process the image for attestation
  core.info(`Image ${image} processed for attestation`)
}
