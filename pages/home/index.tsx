// @ts-nocheck
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import React, { Fragment, useContext, useEffect, useState } from 'react';

import Head from 'next/head';
import Image from 'next/image';

import { getChatbotsForUser } from '@/utils/data/supabase';

import ChatbotGrid from '@/components/ChatbotGrid/ChatbotGrid';
import Loading from '@/components/Loading';
import UploadModal from '@/components/UploadModal';

import { withPageAuthRequired } from '@auth0/nextjs-auth0/client';

const navigation = [{ name: 'Dashboard', href: '#', current: true }];

const userNavigation = [{ name: 'Log out', href: '/api/auth/logout' }];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const Home = ({ user }: any) => {
  const [chatbots, setChatbots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    const fetchChatbots = async () => {
      const result = await getChatbotsForUser(user.sub);
      if (result.error) {
        console.error('Error fetching chatbots:', result.error);
      } else {
        console.log('Chatbots:', result);
        setChatbots(result);
      }
      setLoading(false);
    };
    fetchChatbots();
  }, [user]);

  if (loading) {
    return <Loading />;
  }

  return (
    <>
      <Head>
        <title>Dashboard | NeuralTalk</title>
        <meta name="description" content="NeuralTalk" />
        <meta
          name="viewport"
          content="height=device-height ,width=device-width, initial-scale=1, user-scalable=no"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <UploadModal open={showUploadModal} setOpen={setShowUploadModal} />
      <div className="min-h-full">
        <Disclosure as="nav" className="bg-white shadow-sm">
          {({ open }) => (
            <>
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 justify-between">
                  <div className="flex">
                    <div className="flex flex-shrink-0 items-center">
                      <Image
                        className="block h-10 w-auto lg:hidden"
                        src="/navbar-logo.png"
                        width={100}
                        height={100}
                      />
                      <Image
                        className="hidden h-10 w-auto lg:block"
                        src="/navbar-logo.png"
                        width={100}
                        height={100}
                      />
                    </div>
                    <div className="hidden sm:-my-px sm:ml-6 sm:flex sm:space-x-8">
                      {navigation.map((item) => (
                        <a
                          key={item.name}
                          href={item.href}
                          className={classNames(
                            item.current
                              ? 'border-amber-500 text-gray-900'
                              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                            'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium',
                          )}
                          aria-current={item.current ? 'page' : undefined}
                        >
                          {item.name}
                        </a>
                      ))}
                    </div>
                  </div>
                  <div className="hidden sm:ml-6 sm:flex sm:items-center">
                    {/* Profile dropdown */}
                    <Menu as="div" className="relative ml-3">
                      <div>
                        <Menu.Button className="flex items-center justify-center rounded-full bg-amber-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2 h-8 w-8">
                          <span className="sr-only">Open user menu</span>
                          <span>{user?.name?.[0]?.toUpperCase()}</span>
                        </Menu.Button>
                      </div>

                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-200"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          {userNavigation.map((item) => (
                            <Menu.Item key={item.name}>
                              {({ active }) => (
                                <a
                                  href={item.href}
                                  className={classNames(
                                    active ? 'bg-gray-100' : '',
                                    'block px-4 py-2 text-sm text-gray-700',
                                  )}
                                >
                                  {item.name}
                                </a>
                              )}
                            </Menu.Item>
                          ))}
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  </div>
                  <div className="-mr-2 flex items-center sm:hidden">
                    {/* Mobile menu button */}
                    <Disclosure.Button className="inline-flex items-center justify-center rounded-md bg-white p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2">
                      <span className="sr-only">Open main menu</span>
                      {open ? (
                        <XMarkIcon
                          className="block h-6 w-6"
                          aria-hidden="true"
                        />
                      ) : (
                        <Bars3Icon
                          className="block h-6 w-6"
                          aria-hidden="true"
                        />
                      )}
                    </Disclosure.Button>
                  </div>
                </div>
              </div>

              <Disclosure.Panel className="sm:hidden">
                <div className="space-y-1 pb-3 pt-2">
                  {navigation.map((item) => (
                    <Disclosure.Button
                      key={item.name}
                      as="a"
                      href={item.href}
                      className={classNames(
                        item.current
                          ? 'border-amber-500 bg-amber-50 text-amber-700'
                          : 'border-transparent text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800',
                        'block border-l-4 py-2 pl-3 pr-4 text-base font-medium',
                      )}
                      aria-current={item.current ? 'page' : undefined}
                    >
                      {item.name}
                    </Disclosure.Button>
                  ))}
                </div>
                <div className="border-t border-gray-200 pb-3 pt-4">
                  <div className="mt-3 space-y-1">
                    {userNavigation.map((item) => (
                      <Disclosure.Button
                        key={item.name}
                        as="a"
                        href={item.href}
                        className="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                      >
                        {item.name}
                      </Disclosure.Button>
                    ))}
                  </div>
                </div>
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>
        <main>
          <div className="mx-auto max-w-7xl py-6">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                  <h1 className="text-lg font-semibold leading-6 text-gray-900">
                    My chatbots
                  </h1>
                </div>
                <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                  {/* <button
                    type="button"
                    className="block rounded-md bg-amber-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-amber-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
                    onClick={() => setShowUploadModal(true)}
                  >
                    Create chatbot
                  </button> */}
                </div>
              </div>
              <div className="mt-8 flow-root">
                <ChatbotGrid chatbots={chatbots} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default withPageAuthRequired(Home, {
  onRedirecting: () => <Loading />,
  onError: (error) => <div>{error.message}</div>,
});
