"use client";

import { CertificateHelper } from "@/helpers/cert";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Fragment, useCallback, useRef } from "react";

export type EndpointData = {
  nickname: string;
  hostname: string;
  port: number;
};

export default function EndpointAddSideComponent({
  open,
  setOpen,
  onAdd,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  onAdd: (data: EndpointData) => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  const onAddButton = useCallback(async () => {
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    const data: EndpointData = {
      nickname: formData.get("nickname") as string,
      hostname: formData.get("hostname") as string,
      port: parseInt(formData.get("port") as string),
    };
    //
    onAdd(data);
    // gen cert
    const helper = new CertificateHelper();
    const pems = await helper.generateCertificate(data.hostname);
    console.log(pems);
  }, [onAdd]);

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={setOpen}>
        <div className="fixed inset-0" />

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300 sm:duration-500"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300 sm:duration-500"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col overflow-y-scroll bg-blue-950 py-6 shadow-xl">
                    <div className="px-4 sm:px-6">
                      <div className="flex items-start justify-between">
                        <Dialog.Title className="text-base font-semibold leading-6 text-white">
                          Add Endpoint
                        </Dialog.Title>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            className="relative rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            onClick={() => setOpen(false)}
                          >
                            <span className="absolute -inset-2.5" />
                            <span className="sr-only">Close panel</span>
                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="relative mt-6 flex-1 px-4 sm:px-6">
                      <form
                        className="flex flex-col gap-8 w-full max-w-sm"
                        ref={formRef}
                        onSubmit={(e) => {
                          e.preventDefault();
                          onAddButton();
                        }}
                      >
                        <div className="flex flex-col gap-1">
                          <label className="text-sm">Name</label>
                          <input
                            type="text"
                            name="nickname"
                            className="p-2 bg-transparent border-b border-b-blue-600 caret-blue-600"
                            placeholder="my-server"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-sm">Hostname</label>
                          <input
                            type="text"
                            name="hostname"
                            className="p-2 bg-transparent border-b border-b-blue-600 caret-blue-600"
                            placeholder="local.domain.com"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-sm">Port</label>
                          <input
                            type="text"
                            name="port"
                            className="p-2 bg-transparent border-b border-b-blue-600 caret-blue-600"
                            placeholder="3000"
                          />
                        </div>
                        <div className="">
                          <button className="px-4 py-2 text-white bg-blue-700 rounded-lg">
                            Add
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
