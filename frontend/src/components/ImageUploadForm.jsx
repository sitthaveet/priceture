import React, { useState, useContext } from "react";
import { getStorage, ref, uploadBytes } from "firebase/storage";
import { initializeApp } from "firebase/app";
import { v4 as uuidv4 } from "uuid";
import { AppContext } from "../context/AppContext";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import axios from "axios";
import Resizer from "react-image-file-resizer";

function ImageUploadForm({ pageCount, setPageCount }) {
  const [image, setImage] = useState(null);
  const { metadataInContext, setMetadataInContext } = useContext(AppContext);
  const { priceArr, setPriceArr } = useContext(AppContext);
  const [generateImageStatus, setGenerateImageStatus] = useState(null);
  const [progressGenerateImage, setProgressGenerateImage] = useState(null);
  const { ipfsUrls, setIpfsUrls } = useContext(AppContext);

  // API token for Imagine API
  const imagine_api_token = "sbac0GOtT6UoDni3tGQMT3K_FxeSsqIn";

  // Pintata API
  const pintata_jwt =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJiMTFjMjFlZC0wMzEzLTRlNzQtYjJhZi0xMTYxNmZhNDY2MDYiLCJlbWFpbCI6InNpdHRoYXZlZS50QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImlkIjoiRlJBMSIsImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxfV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiJlNmFkNGQwMGMzMTY4MGJiZDI5YSIsInNjb3BlZEtleVNlY3JldCI6IjU1MjFlYmRmYjUzN2YwOTZkMGIyODhlMWJjNzcxM2JjZTg3YzM0YTUyMTBjODQ2MzJkOTJjNjhmZjFhOTM1NmQiLCJpYXQiOjE3MTY0NDk0OTR9.cpJvmgqwiD22ebRn38yKYrkrih-1Y_WJXMR2xJRrKTw";

  // Firebase configuration and initialization
  const firebaseConfig = {
    apiKey: "API_KEY",
    authDomain: "priceture.firebaseapp.com",
    databaseURL: "https://DATABASE_NAME.firebaseio.com",
    projectId: "priceture",
    storageBucket: "priceture.appspot.com",
    messagingSenderId: "754334414708",
    appId: "APP_ID",
  };
  const app = initializeApp(firebaseConfig);
  const storage = getStorage(app);

  // resize image file function
  const resizeFile = (file) =>
    new Promise((resolve) => {
      Resizer.imageFileResizer(
        file,
        900,
        900,
        "JPEG",
        100,
        0,
        (uri) => {
          resolve(uri);
        },
        "blob"
      );
    });

  // handle image upload
  const handleChange = (e) => {
    if (e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  // upload image to firebase storage
  const handleUpload = async (e) => {
    e.preventDefault();
    setGenerateImageStatus("process");
    setProgressGenerateImage("uploading image")
    if (image) {
      // remove spaces from image name to prevent error in Midjourney API
      const imageNameWithOutSpace = image.name.replace(/\s/g, "");
      const imageName = imageNameWithOutSpace;
      const resizedImage = await resizeFile(image);

      // specify the image reference on Firebase storage
      const imageRef = ref(storage, `images/${imageName}`);
      try {
        await uploadBytes(imageRef, resizedImage);
        console.log(
          `Your image URL is : https://firebasestorage.googleapis.com/v0/b/priceture.appspot.com/o/images%2F${imageName}?alt=media`
        );
      } catch (error) {
        console.error("Error uploading image: ", error);
      }

      // Generate 4 images on imagine API based on the uploaded image URL
      const prompt = [
        {
          prompt: `https://firebasestorage.googleapis.com/v0/b/priceture.appspot.com/o/images%2F${imageName}?alt=media enhance the expression of object or person to feel miserable and very sad while keeping the posture of character and background remains unchanged --w 0 --s 500 --iw 3`,
        },
        {
          prompt: `https://firebasestorage.googleapis.com/v0/b/priceture.appspot.com/o/images%2F${imageName}?alt=media enhance the expression of object or person to feel a bit sad while keeping the posture of character and background remains unchanged --w 0 --s 500 --iw 3`,
        },
        {
          prompt: `https://firebasestorage.googleapis.com/v0/b/priceture.appspot.com/o/images%2F${imageName}?alt=media enhance the expression of object or person to feel a bit happier while keeping the posture of character and background remains unchanged --w 0 --s 500 --iw 3`,
        },
        {
          prompt: `https://firebasestorage.googleapis.com/v0/b/priceture.appspot.com/o/images%2F${imageName}?alt=media enhance the expression of object or person to feel very happy and full of joy while keeping the posture of character and background remains unchanged --w 0 --s 500 --iw 3`,
        },
      ];

      // we wrap it in a main function here so we can use async/await inside of it.
      async function generateImage(i) {
        return new Promise(async (resolve, reject) => {
          let promptResponseData;

          // generate the image
          try {
            const response = await fetch(
              "https://cl.imagineapi.dev/items/images/",
              {
                method: "POST",
                headers: {
                  Authorization: "Bearer " + imagine_api_token,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(prompt[i]),
              }
            );

            promptResponseData = await response.json();
            console.log(promptResponseData);
          } catch (error) {
            console.error("Error generating image:", error);
            throw error;
          }

          // check if the image has finished generating
          let counter = 0;
          const maxAttempts = 30;

          const intervalId = setInterval(async function () {
            try {
              console.log("Checking image details");
              const response = await fetch(
                `https://cl.imagineapi.dev/items/images/${promptResponseData.data.id}`,
                {
                  method: "GET",
                  headers: {
                    Authorization: "Bearer " + imagine_api_token,
                    "Content-Type": "application/json",
                  },
                }
              );

              const responseData = await response.json();

              if (
                responseData.data.status === "completed" ||
                responseData.data.status === "failed"
              ) {
                // img generation done, stop repeating
                clearInterval(intervalId);
                console.log(
                  "Result of image #",
                  i + 1,
                  ": ",
                  responseData.data
                );
                setProgressGenerateImage("succesfully generate image number " + i);

                // upload the image to firebase storage
                async function uploadGenImageToFirebase() {
                  try {
                    setProgressGenerateImage("uploading generated image to cloud");
                    const genImageUrl = responseData.data.upscaled_urls[0];
                    const response = await axios({
                      url: genImageUrl,
                      method: "GET",
                      responseType: "blob",
                    });
                    const genImageBlob = response.data;
                    const resizedGenImageBlob = await resizeFile(genImageBlob);
                    const genImageName = uuidv4() + ".JPEG";
                    const genImageRef = ref(storage, `images//${genImageName}`);
                    await uploadBytes(genImageRef, resizedGenImageBlob);
                    console.log(
                      "success upload generated image on Firebase of #",
                      i
                    );
                    setProgressGenerateImage("successfully uploaded generated image number " + i + " to cloud");

                    // setup metadata for each round of image geneartion
                    let metadata = {
                      name: "Priceture NFT",
                      description: "Your Price, Your Mood, Your NFT",
                      image: `https://firebasestorage.googleapis.com/v0/b/priceture.appspot.com/o/images%2F${genImageName}?alt=media`,
                      attributes: [
                        {
                          trait_type: "Feeling",
                          value: `${
                            i === 0
                              ? "Very Sad"
                              : i === 1
                              ? "Sad"
                              : i === 2
                              ? "Happy"
                              : "Very Happy"
                          }`,
                        },
                      ],
                    };

                    resolve(metadata); // Resolve the Promise with metadataArray
                  } catch (error) {
                    console.error(
                      "Error uploading gen image to Firebase: ",
                      error
                    );
                  }
                }

                uploadGenImageToFirebase();
              } else {
                console.log(
                  "Image is not finished generation. Status: ",
                  responseData.data.status
                );
                counter++;
                if (counter >= maxAttempts) {
                  clearInterval(intervalId);
                  console.log(
                    "Exceeded maximum attempts. Stopping image generation."
                  );
                }
              }
            } catch (error) {
              console.error("Error getting updates", error);
              alert(
                "There is an error in Discord or Midjourney API. Please try again later."
              );
              throw error;
            }
          }, 10000 /* every 10 seconds */);
        });
      }

      // create metadata JSON for NFT
      async function createMetaData() {
        return new Promise(async (resolve, reject) => {
          // function to generate all images at the same time
          async function generateAllImages(prompts) {
            setProgressGenerateImage("generating 4 images")
            const imagePromises = prompts.map((_, index) =>
              generateImage(index)
            );
            try {
              const allMetadata = await Promise.all(imagePromises);
              console.log("All metadata:", allMetadata);
              return allMetadata; // This array will be in the correct order
            } catch (error) {
              console.error("An error occurred:", error);
            }
          }

          // Usage the generateAllImages function:
          (async () => {
            try {
              const allMetadata = await generateAllImages(prompt);
              // Add the uploaded image metadata at the middle of array
              allMetadata.splice(2, 0, {
                name: "Priceture NFT",
                description: "Your Price, Your Mood, Your NFT",
                image: `https://firebasestorage.googleapis.com/v0/b/priceture.appspot.com/o/images%2F${imageName}?alt=media`,
                attributes: [
                  {
                    trait_type: "Feeling",
                    value: "Normal",
                  },
                ],
              });

              if (allMetadata.length > prompt.length) {
                const metadata = {
                  file: allMetadata,
                };
                console.log("Your JSON metada is : " + metadata);

                // const jsonString = JSON.stringify(metadata);
                const jsonStringArr = [
                  JSON.stringify(allMetadata[0]),
                  JSON.stringify(allMetadata[1]),
                  JSON.stringify(allMetadata[2]),
                  JSON.stringify(allMetadata[3]),
                  JSON.stringify(allMetadata[4]),
                ];
                console.log("jsonStringArr is: ", jsonStringArr);

                try {
                  // upload metadata JSON to IPFS via Pinata
                  let allIpfsUrl = [];
                  for (let i = 0; i < jsonStringArr.length; i++) {
                    const res = await fetch(
                      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
                      {
                        method: "POST",
                        headers: {
                          Authorization: `Bearer ${pintata_jwt}`,
                          "Content-Type": "application/json",
                        },
                        body: jsonStringArr[i],
                      }
                    );
                    const resData = await res.json();
                    allIpfsUrl.push(
                      "https://aqua-mobile-bandicoot-440.mypinata.cloud/ipfs/" +
                        resData.IpfsHash
                    );
                  }

                  // add IPFS link to the state
                  if (allIpfsUrl.length === jsonStringArr.length) {
                    console.log("allIpfsUrl is: ", allIpfsUrl);

                    setIpfsUrls(allIpfsUrl);
                  }
                } catch (error) {
                  console.error("Error uploading json: ", error);
                }
                resolve(metadata);
              } else {
                console.log("Error in creating metadata.");
              }
            } catch (error) {
              console.error("Error generating images:", error);
            }
          })();
        });
      }

      async function createMetaDataFunction() {
        let metadataReturn = await createMetaData();
        console.log("the metadataReturn is: " + metadataReturn);
        setMetadataInContext(() => metadataReturn);
        setGenerateImageStatus(() => "done");
      }
      await createMetaDataFunction();

      // if users do not upload anything
    } else {
      alert("Please select an image to upload");
    }
  };

  // Handle go to next page
  const handleClick = () => {
    if (setGenerateImageStatus === "done") setPageCount(pageCount + 1);
    // else return;
    else setPageCount(pageCount + 1);
  };
  return (
    <div>
      <div className="mainContent__header">
        <div className="mainContent__header-stepname">Step 2: Upload Image</div>
        <div className="mainContent__header-explain">
          Upload any image of your favorite. This image will be turned into an
          NFT.
          <br /> Your image must be square less than 1 MB
        </div>
      </div>
      <div className="mainContent__body">
        <form
          className="mainContent__body-imageUploadForm"
          onSubmit={handleUpload}
        >
          <input
            type="file"
            className="mainContent__body-uploadFile"
            onChange={handleChange}
          />
          {generateImageStatus === "done" || !image ? null : (
            <button
              className={
                generateImageStatus === "process"
                  ? "bg-slate-800 rounded-md px-3 py-1 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  : "actionBtn"
              }
              type="submit"
              disabled={generateImageStatus === "process"}
            >
              {generateImageStatus === "process" ? (
                <Box sx={{ display: "flex" }}>
                  <CircularProgress />
                </Box>
              ) : generateImageStatus === "done" ? null : (
                "Upload Image"
              )}
            </button>
          )}
        </form>
        {generateImageStatus === "process" ? (
          <div>
            <p>
              It usually takes 3-10 mins. You can go grab a coffee ☕️ or take a nap 😴
            </p>
            <br></br>
            <p>What we are doing behind the scene ✅:</p><p className='decoration-solid'>{progressGenerateImage}</p>
          </div>
        ) : null}
      </div>
      <div className="mainContent__footer">
        <button
          className={
            generateImageStatus === "done"
              ? "confirmBtn"
              : "confirmBtn-disabled"
          }
          onClick={handleClick}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default ImageUploadForm;
