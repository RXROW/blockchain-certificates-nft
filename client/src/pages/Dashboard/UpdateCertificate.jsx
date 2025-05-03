 updata-cerifit
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
// new>
const validationSchema = Yup.object().shape({
  searchType: Yup.string()
    .required('required'),
  searchQuery: Yup.string()
    .required('Search query is required'),
  newGrad: Yup.number()
    .required('New graduation year is required')
    .min(1, 'Year must be at least 1')
    .max(100, 'Year must not exceed 100'),
  updateReason: Yup.string()
    .required('Update reason is required')
    .min(10, 'Update reason must be at least 10 characters')
})

const UpdateCertificate = () => {
  const navigate = useNavigate()

  const initialValues = {
    searchType: '',
    searchQuery: '',
    newGrad: '',
    updateReason: ''
  }

  const handleSubmit = (values, { setSubmitting }) => {
    console.log('Form values:', values)
    setSubmitting(false)
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-950 to-violet-950 p-6'>
      <div className="container mx-auto max-w-4xl">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center text-violet-400 hover:text-violet-300 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back
        </button>

        <div className="bg-white/5 backdrop-blur-lg rounded-xl shadow-2xl p-8 border border-white/10">
          <h1 className='text-4xl py-4 text-center font-bold sm:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-yellow-500 mb-4'>
            Update Certificate
          </h1>
          <p className="text-center text-white/70 mb-8 max-w-2xl mx-auto">
            Search for a certificate using student name, ID, or certificate ID. Then update the graduation year and provide a reason for the update.
          </p>

          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-6">
                {/* Search Section */}
                <div className="mb-8">
                  <div className="flex gap-2">
                    <div className="relative">
                      <Field
                        as="select"
                        name="searchType"
                        className="w-32 p-3 rounded-lg bg-white/10 border border-white/20 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/50 transition-all text-white"
                      >
                        <option value="" className="bg-violet-500 ">Type</option>
                        <option value="name" className="bg-violet-500 ">Name</option>
                        <option value="id" className="bg-violet-500 ">ID</option>
                        <option value="idcertificate" className="bg-violet-500 ">ID Certificate</option>
                      </Field>
                      <ErrorMessage
                        name="searchType"
                        component="div"
                        className="absolute -bottom-6 left-0 text-red-400 text-sm"
                      />
                    </div>

                    <div className="relative flex-1">
                      <Field
                        type="text"
                        name="searchQuery"
                        placeholder="Search..."
                        className="w-full p-3 rounded-lg bg-white/10 border border-white/20 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/50 transition-all text-white placeholder-white/50"
                      />
                      <ErrorMessage
                        name="searchQuery"
                        component="div"
                        className="absolute -bottom-6 left-0 text-red-400 text-sm"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-3 bg-gradient-to-r from-violet-600 to-violet-700 text-white rounded-lg hover:from-violet-700 hover:to-violet-800 transition-all shadow-lg hover:shadow-violet-500/25 disabled:opacity-50"
                    >
                      Search
                    </button>
                  </div>
                </div>

                {/* New Grad */}
                <div className='space-y-2'>
                  <label htmlFor='newGrad' className='block text-lg font-medium text-white/90'>
                    New Grad
                  </label>
                  <div className="relative">
                    <Field
                      type='number'
                      name='newGrad'
                      className='w-full p-3 rounded-lg bg-white/10 border border-white/20 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/50 transition-all text-white appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
                    />
                    <ErrorMessage
                      name="newGrad"
                      component="div"
                      className="absolute -bottom-6 left-0 text-red-400 text-sm"
                    />
                  </div>
                </div>

                {/* Update Reason */}
                <div className='space-y-2'>
                  <label htmlFor='updateReason' className='block text-lg font-medium text-white/90'>
                    Update Reason
                  </label>
                  <div className="relative">
                    <Field
                      as="textarea"
                      name='updateReason'
                      rows='4'
                      className='w-full p-3 rounded-lg bg-white/10 border border-white/20 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/50 transition-all text-white resize-none'
                    />
                    <ErrorMessage
                      name="updateReason"
                      component="div"
                      className="absolute -bottom-6 left-0 text-red-400 text-sm"
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className='flex gap-4 pt-4'>
                  <button
                    type='submit'
                    disabled={isSubmitting}
                    className='flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-blue-500/25 disabled:opacity-50'
                  >
                    Submit
                  </button>
                  <button
                    type='button'
                    onClick={() => navigate(-1)}
                    className='flex-1 px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all shadow-lg hover:shadow-gray-500/25'
                  >
                    Cancel
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  )
}

export default UpdateCertificate
 import React from 'react'
 
 const UpdateCertificate = () => {
   return (
     <div className='mt-28 text-white'>UpdateCertificate</div>
   )
 }
 
 export default UpdateCertificate
 main
